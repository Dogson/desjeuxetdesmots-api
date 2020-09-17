import Parser = require("rss-parser");
import _ = require("lodash");
import * as moment from 'moment';
import {CreateEpisodeDto} from "../dto/episode.dto";
import {CreateMediaDto} from "../dto/media.dto";


const EPISODE_URL_TYPES = {
    soundcloud: "https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/::id",
    acast: "https://player.acast.com/5b7ac427c6a58e726f576cff/episodes/::id"
};

/**
 * Return a media with a list of episodes parsed from a RSS feed
 * @param feedUrl
 */
export async function parseRssMedia(feedUrl: string): Promise<CreateMediaDto> {
    const parser = new Parser();
    const feed = await parser.parseURL(feedUrl);

    const episodes: CreateEpisodeDto[] = feed.items.map(function (entry) {
        return {
            name: entry.title,
            image: entry.itunes.image,
            description: generateEpisodeDescription(entry.itunes.summary, feedUrl),
            releaseDate: moment(entry.pubDate).toDate(),
            embeddedUrl: generateEpisodeUrl(entry.guid, feedUrl)
        };
    })
        .filter(filterEpisodes);

    return {
        name: feed.title,
        logo: feed.image.url,
        description: generateMediaDescription(feed.description, feedUrl),
        feedUrl: feedUrl,
        episodes: episodes
    };
}

/**
 * Filter out episodes with wrong format
 * @param episode
 */
function filterEpisodes(episode: CreateEpisodeDto): boolean {
    if (!episode.embeddedUrl) {
        return false;
    }
    if (episode.embeddedUrl.indexOf("acast") > -1)
        return episode.embeddedUrl.indexOf("djpod") === -1;
    return true;
}

/**
 * generate the correct media description given the format of the RSS feed
 * @param description
 * @param feedUrl
 */
function generateMediaDescription(description, feedUrl): string {
    if (feedUrl && feedUrl.indexOf("soundcloud") > -1) {
        return description;
    }
    if (feedUrl && feedUrl.indexOf("acast") > -1) {
        return strip_html_tags(description).substring(0, strip_html_tags(description).indexOf('Voir Acast'))
    }
}

/**
 * generate the correct episode description given the format of the RSS feed
 * @param description
 * @param feedUrl
 */
function generateEpisodeDescription(description, feedUrl): string {
    if (feedUrl && (feedUrl.indexOf("soundcloud") > -1 || feedUrl.indexOf("acast") > -1)) {
        return generateMediaDescription(description, feedUrl);
    }
}

/**
 * Generate the correct episode embbeded url given the format of the RSS field
 * @param guid
 * @param feedUrl
 */
function generateEpisodeUrl(guid: string, feedUrl: string): string {
    if (feedUrl && feedUrl.indexOf("soundcloud") > -1) {
        const id = guid.substring(guid.indexOf('tracks/') + 1).replace('racks/', '');
        return EPISODE_URL_TYPES.soundcloud.replace('::id', id)
    }
    if (feedUrl && feedUrl.indexOf("acast") > -1) {
        return EPISODE_URL_TYPES.acast.replace('::id', guid);
    }
}

/**
 * Strip all html tags from a string
 * @param str
 */
function strip_html_tags(str): string {
    if ((str == null) || (str === ''))
        return str;
    else
        str = str.toString();
    str = _.unescape(str.replace(/<\/?[^>]+(>|$)/g, ""));
    str = str.replace(/&nbsp;/g, ' ');
    return str;
}
