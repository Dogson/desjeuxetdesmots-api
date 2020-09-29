import Parser = require("rss-parser");
import _ = require("lodash");
import * as moment from 'moment';
import {CreateEpisodeDto} from "../dto/episodes.dto";
import {MediaConfig} from "../model/media.model";

/**
 * Return a media with a list of episodes parsed from a RSS feed
 * @param feedUrl
 * @param config
 */
export async function parseRssMedia(feedUrl: string, config: MediaConfig): Promise<CreateEpisodeDto[]> {
    const parser = new Parser();
    const feed = await parser.parseURL(feedUrl);

    return feed.items.filter((entry) => {
       return filterEpisodeByMinDuration(entry, config.minDuration);
    }).map(function (entry) {
        return {
            name: entry.title,
            image: entry.itunes.image || feed.image.url,
            description: generateEpisodeDescription(entry.itunes.summary, feedUrl),
            releaseDate: moment(entry.pubDate).toDate(),
            fileUrl: entry.enclosure.url,
            media: {
                name: feed.title,
                logo: feed.image.url,
                description: generateMediaDescription(feed.description, feedUrl),
                type: "podcast",
                config: config,
                feedUrl: feedUrl
            },
            config: config
        };
    })
        .filter((episode) => {return filterEpisodes(episode, config)});
}

/**
 * Filter out episodes with wrong format
 * @param episode
 * @param config
 */
function filterEpisodes(episode: CreateEpisodeDto, config: MediaConfig): boolean {
    let ignoreEpisode = false;
    config.ignoreEpisode.forEach((ignoreStr) => {
        if (episode[config.parseProperty].indexOf(ignoreStr) > -1) {
            ignoreEpisode = true;
        }
    });
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
 * @param entry : episode feed
 * @param minDuration : min duration of episode
 */
function filterEpisodeByMinDuration(entry: any, minDuration?: number) {
    if (!minDuration) {
        return true;
    }
    const hms =  entry.itunes.duration;
    if (hms) {
        return true;
    }
    const units = hms.split(':');

    const minutes = (+units[0]) * 60 + (+units[1]);
    if (minutes < minDuration) {
        console.log(entry.title);
    }
    return minutes >= minDuration;
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
        let strippedDesc = strip_html_tags(description);
        if (strippedDesc.indexOf("Voir Acast") > -1) {
            strippedDesc = strippedDesc.substring(0, strip_html_tags(description).indexOf('Voir Acast'))
        }
        return strippedDesc;
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
