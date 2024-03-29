import Parser = require("rss-parser");
import decode_entity = require('entity-decode/node');
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
        let parser = new Parser({
            requestOptions: {
                rejectUnauthorized: false
            },
            customFields: {
                item: ['description']
            }
        });
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
            let epName = entry.title;
            if (feedUrl.indexOf("zqsd") > -1) {
                epName = entry.itunes.subtitle;
                // Cleaning the mess that are ZQSD publication dates
                entry.pubDate = entry.pubDate.substring(4);
            }
            return {
                name: epName,
                image: type === "video" ? entry.mediaGroup["media:thumbnail"][0].$.url : entry.itunes.image || feed.image.url,
                description: type === "video" ? entry.mediaGroup["media:description"][0] : _this._generateEpisodeDescription(entry, feedUrl),
                releaseDate: moment(entry.pubDate).toDate(),
                fileUrl: type === "video" ? entry.link : entry.enclosure.url,
                keywords: entry.itunes && entry.itunes.keywords,
                media: {
                    name: name || feed.title,
                    searchableIndex: (name || feed.title).toUpperCase(),
                    logo: logo || (feed.itunes && feed.itunes.image) || feed.image.url,
                    description: description || _this._generateMediaDescription(feed.description, feedUrl) || name || feed.title,
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

    async generateYoutubeEpisodes(feedUrl: string, config: MediaConfig, youtubeChannelId: string, youtubePlaylistId?: string, name?: string): Promise<EpisodeDto[]> {
        let channelUrl = process.env.YOUTUBE_API_CHANNEL_URL;
        channelUrl = channelUrl.replace("${channelId}", youtubeChannelId);
        channelUrl = channelUrl.replace("${apiKey}", process.env.YOUTUBE_API_KEY);
        const response = await axios.get(channelUrl);
        if (!response.data || !response.data.items && !response.data.items[0]) {
            throw new InternalServerErrorException(ERROR_TYPES.youtube_request_error(`This channel does not exist : ${youtubeChannelId}`));
        }
        const mediaInfos = response.data.items[0].snippet;
        feedUrl = process.env.YOUTUBE_RSS_URL;
        feedUrl = feedUrl.replace("${channelId}", youtubeChannelId);
        const media: MediaDto = {
            name: name || mediaInfos.title,
            searchableIndex: (name || mediaInfos.title).toUpperCase(),
            logo: mediaInfos.thumbnails.medium.url,
            description: mediaInfos.description || `Chaîne Youtube de ${name || mediaInfos.title}`,
            type: "video",
            config: config,
            feedUrl: feedUrl
        }
        return await this._generateYoutubeEpisodePage([], null, media, youtubeChannelId, youtubePlaylistId, name);
    }

    private async _generateYoutubeEpisodePage(episodes: EpisodeDto[], pageToken: string, media: MediaDto, youtubeChannelId: string, youtubePlaylistId?: string, name?: string): Promise<EpisodeDto[]> {
        let url;
        if (youtubePlaylistId) {
            url = process.env.YOUTUBE_API_PLAYLIST_URL.replace('${playlistId}', youtubePlaylistId);
        } else {
            url = process.env.YOUTUBE_API_SEARCH_URL.replace("${channelId}", youtubeChannelId);
        }
        url = url.replace("${apiKey}", process.env.YOUTUBE_API_KEY);
        if (pageToken) {
            url += `&pageToken=${pageToken}`
        }
        try {
            const response = await axios.get(url);
            const nextPageToken = response.data.nextPageToken;
            await asyncForEach(response.data.items, async (video) => {
                const videoInfos = video.snippet;
                const id = youtubePlaylistId ? videoInfos.resourceId.videoId : video.id.videoId;
                videoInfos.description = await this._getYoutubeVideoDescription(id) || videoInfos.description;
                const episode = {
                    name: decode_entity(videoInfos.title),
                    description: videoInfos.description || " ",
                    fileUrl: `https://www.youtube.com/watch?v=${id}`,
                    image: videoInfos.thumbnails.medium && videoInfos.thumbnails.medium.url,
                    releaseDate: moment(videoInfos.publishedAt).toDate(),
                    media: media
                }
                if (episode.image) {
                    episodes.push(episode);
                }
            })

            if (nextPageToken) {
                await this._generateYoutubeEpisodePage(episodes, nextPageToken, media, youtubeChannelId, youtubePlaylistId, name);
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
        return videoResponse.data.items[0] && videoResponse.data.items[0].snippet.description;
    }

    /**
     * Filter out episodes with wrong format
     * @param episode
     * @param config
     */
    private _filterEpisodes(episode: EpisodeDto, config: MediaConfig): boolean {
        let ignoreEpisode = false;
        config.ignoreEpisode.forEach((ignoreStr) => {
            if (episode[config.parseProperty].toUpperCase().indexOf(ignoreStr.toUpperCase()) > -1) {
                ignoreEpisode = true;
            }
        });

        config.ignoreEpisodeRegex && config.ignoreEpisodeRegex.forEach((ignoreRegex) => {
            if (new RegExp(ignoreRegex).test(episode[config.parseProperty])) {
                ignoreEpisode = true;
            }
        })

        if (config.episodeMustInclude && config.episodeMustInclude.length > 0) {
            ignoreEpisode = true;
        }
        config.episodeMustInclude && config.episodeMustInclude.forEach((string) => {
            if (episode[config.parseProperty].toUpperCase().indexOf(string.toUpperCase()) > -1) {
                ignoreEpisode = false;
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
        if (feedUrl && (feedUrl.indexOf("acast") > -1 || feedUrl.indexOf("afterhate") > -1 || feedUrl.indexOf("la-dev-team"))) {
            if (description.indexOf("Voir Acast") > -1) {
                description = description.substring(0, description.indexOf('Voir Acast'))
            }
            return description;
        } else {
            return description;
        }
    }

    /**
     * generate the correct episode description given the format of the RSS feed
     * @param entry
     * @param feedUrl
     */
    private _generateEpisodeDescription(entry, feedUrl): string {
        if (feedUrl &&
            (feedUrl.indexOf("afterhate") > -1)) {
            return this._generateMediaDescription(entry['content:encoded'], feedUrl);
        } else {
            return this._generateMediaDescription(entry.description || entry.itunes.summary || entry.itunes.subtitle, feedUrl);
        }
    }
}