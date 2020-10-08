import Parser = require("rss-parser");
import decode = require('unescape');
import _ = require("lodash");
import * as moment from 'moment';
import {Injectable, InternalServerErrorException} from "@nestjs/common";
import {MediaConfig} from "../episodes/model/media.model";
import {EpisodeDto} from "../episodes/dto/episodes.dto";
import axios from "axios";
import {ERROR_TYPES} from "../../shared/const/error.types";
import {MediaDto} from "../episodes/dto/media.dto";
import {asyncForEach} from "../../shared/utils/utils";

@Injectable()
export class EpisodeGenerationService {

    async parseRssMedia(feedUrl: string, config: MediaConfig, type: string, logo?: string, description?: string, name?: string): Promise<EpisodeDto[]> {
        let parser = new Parser();
        if (type === "video") {
            parser = new Parser({
                    customFields: {
                        item: [
                            ['media:group', 'mediaGroup'],
                            ['published', 'pubDate']
                        ]
                    }
                }
            );
        }

        const feed = await parser.parseURL(feedUrl);
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const _this = this;

        return feed.items.filter((entry) => {
            return this._filterEpisodeByMinDuration(entry, config.minDuration);
        }).map(function (entry) {
            return {
                name: entry.title,
                image: type === "video" ? entry.mediaGroup["media:thumbnail"][0].$.url : entry.itunes.image || feed.image.url,
                description: type === "video" ? entry.mediaGroup["media:description"][0] : _this._generateEpisodeDescription(entry.itunes.summary, feedUrl),
                releaseDate: moment(entry.pubDate).toDate(),
                fileUrl: type === "video" ? entry.link : entry.enclosure.url,
                media: {
                    name: name || feed.title,
                    logo: logo || feed.image.url,
                    description: description || _this._generateMediaDescription(feed.description, feedUrl),
                    type: type,
                    config: config,
                    feedUrl: feedUrl
                }
            };

        })
            .filter((episode: EpisodeDto) => {
                return this._filterEpisodes(episode, config)
            });
    }

    async generateYoutubeEpisodes(feedUrl: string, config: MediaConfig, youtubeId: string, name?: string): Promise<EpisodeDto[]> {
        let channelUrl = process.env.YOUTUBE_API_CHANNEL_URL;
        channelUrl = channelUrl.replace("${channelId}", youtubeId);
        channelUrl = channelUrl.replace("${apiKey}", process.env.YOUTUBE_API_KEY);
        const response = await axios.get(channelUrl);
        if (!response.data || !response.data.items && !response.data.items[0]) {
            throw new InternalServerErrorException(ERROR_TYPES.youtube_request_error(`This channel does not exist : ${youtubeId}`));
        }
        const mediaInfos = response.data.items[0].snippet;
        feedUrl = process.env.YOUTUBE_RSS_URL;
        feedUrl = feedUrl.replace("${channelId}", youtubeId);
        const media: MediaDto = {
            name: mediaInfos.title,
            logo: mediaInfos.thumbnails.medium.url,
            description: mediaInfos.description,
            type: "video",
            config: config,
            feedUrl: feedUrl
        }
        return await this._generateYoutubeEpisodePage([], null, media, youtubeId, name);
    }

    private async _generateYoutubeEpisodePage(episodes: EpisodeDto[], pageToken: string, media: MediaDto, youtubeId: string, name?: string): Promise<EpisodeDto[]> {
        let url = process.env.YOUTUBE_API_SEARCH_URL;
        url = url.replace("${apiKey}", process.env.YOUTUBE_API_KEY);
        url = url.replace("${channelId}", youtubeId);
        if (pageToken) {
            url += `&pageToken=${pageToken}`
        }
        try {
            const response = await axios.get(url);

            if (response.data.items.length <= 0) {
                return [];
            }
            const nextPageToken = response.data.nextPageToken;
            await asyncForEach(response.data.items, async (video) => {
                const id = video.id.videoId;
                const videoInfos = video.snippet;

                videoInfos.description = await this._getYoutubeVideoDescription(id);

                const episode = {
                    name: decode(videoInfos.title),
                    description: videoInfos.description,
                    fileUrl: `https://www.youtube.com/watch?v=${id}`,
                    image: videoInfos.thumbnails.medium.url,
                    releaseDate: moment(videoInfos.publishedAt).toDate(),
                    media: media
                }
                episodes.push(episode);
            })

            if (nextPageToken) {
                await this._generateYoutubeEpisodePage(episodes, nextPageToken, media, youtubeId, name);
            }
            return episodes.filter((episode: EpisodeDto) => {
                return this._filterEpisodes(episode, media.config)
            });
        } catch (err) {
            throw new InternalServerErrorException(ERROR_TYPES.youtube_request_error(err));
        }


    }

    /**
     * Fetch a video description from the id using Youtube API V3
     * @param videoId
     * @private
     */
    private async _getYoutubeVideoDescription(videoId: string): Promise<string> {
        let url = process.env.YOUTUBE_API_VIDEO_URL;
        url = url.replace("${apiKey}", process.env.YOUTUBE_API_KEY);
        url = url.replace("${videoId}", videoId);

        const videoResponse = await axios.get(url);

        return videoResponse.data.items[0].snippet.description;
    }

    /**
     * Filter out episodes with wrong format
     * @param episode
     * @param config
     */
    private _filterEpisodes(episode: EpisodeDto, config: MediaConfig): boolean {
        let ignoreEpisode = false;
        config.ignoreEpisode.forEach((ignoreStr) => {
            if (episode[config.parseProperty].indexOf(ignoreStr) > -1) {
                ignoreEpisode = true;
            }
        });

        config.ignoreEpisodeRegex && config.ignoreEpisodeRegex.forEach((ignoreRegex) => {
            if (new RegExp(ignoreRegex).test(episode[config.parseProperty])) {
                ignoreEpisode = true;
            }
        })

        config.episodeMustInclude && config.episodeMustInclude.forEach((string) => {
            if (episode[config.parseProperty].indexOf(string) === -1) {
                ignoreEpisode = true;
            }
        })
        if (ignoreEpisode) {
            return false;
        }
        if (!episode.fileUrl) {
            return false;
        }
        if (episode.fileUrl.indexOf("acast") > -1)
            return episode.fileUrl.indexOf("djpod") === -1;

        return episode.releaseDate >= moment(1325376).toDate();

    }

    /**
     * Return false if episode isn't long enough
     * @param entry episode feed
     * @param minDuration min duration of episode
     */
    private _filterEpisodeByMinDuration(entry: any, minDuration?: number) {
        if (!minDuration) {
            return true;
        }
        const hms = entry.itunes.duration;
        if (hms) {
            return true;
        }
        const units = hms.split(':');

        const minutes = (+units[0]) * 60 + (+units[1]);
        return minutes >= minDuration;
    }

    /**
     * generate the correct media description given the format of the RSS feed
     * @param description
     * @param feedUrl
     */
    private _generateMediaDescription(description, feedUrl): string {
        if (feedUrl && feedUrl.indexOf("soundcloud") > -1) {
            return description;
        }
        if (feedUrl && feedUrl.indexOf("acast") > -1) {
            let strippedDesc = this._strip_html_tags(description);
            if (strippedDesc.indexOf("Voir Acast") > -1) {
                strippedDesc = strippedDesc.substring(0, this._strip_html_tags(description).indexOf('Voir Acast'))
            }
            return strippedDesc;
        }
    }

    /**
     * generate the correct episode description given the format of the RSS feed
     * @param description
     * @param feedUrl
     */
    private _generateEpisodeDescription(description, feedUrl): string {
        if (feedUrl && (feedUrl.indexOf("soundcloud") > -1 || feedUrl.indexOf("acast") > -1)) {
            return this._generateMediaDescription(description, feedUrl);
        }
    }

    /**
     * Strip all html tags from a string
     * @param str
     */
    private _strip_html_tags(str): string {
        if ((str == null) || (str === ''))
            return str;
        else
            str = str.toString();
        str = _.unescape(str.replace(/<\/?[^>]+(>|$)/g, ""));
        str = str.replace(/&nbsp;/g, ' ');
        return str;
    }

}