import {
    Injectable, Logger
} from "@nestjs/common";
import {MediaConfig} from "../media/model/media.model";
import {CreateGameDto} from "../games/dto/games.dto";
import axios from "axios";
import {InjectModel} from "@nestjs/mongoose";
import {Model} from "mongoose";
import {Game} from "../games/model/games.model";

@Injectable()
export class GameGenerationService {
    private logger = new Logger('EpisodesService');

    constructor(
        @InjectModel('Game') private readonly gameModel: Model<Game>
    ) {
    }

    public async fetchAndPopulateGames(episode) {
            console.log("todo")
    }

    public async addGameEpisode(gameId: string, episodeId: string) {
        console.log("addgameepisode");
    }

    private async _getVideoGamesFromString(str: string, mediaConfig: MediaConfig): Promise<CreateGameDto[]> {
        let games: CreateGameDto[] = [];
        let ignoreEpisode = false;
        mediaConfig.ignoreEpisode.forEach((str) => {
            if (str.indexOf(str) > -1) {
                ignoreEpisode = true;
            }
        });
        if (ignoreEpisode) {
            return [];
        }
        str = this._parseDescription(str, mediaConfig);
        const words = str.split(/\s+/);
        games = await this._getGamesFromArray(words);
        return games;
    }

    private async _getGamesFromArray(words: string[]): Promise<CreateGameDto[]> {
        const resultGames: CreateGameDto[] = [];
        for (let i = 0; i < words.length; i++) {
            let word: string = words[i];
            let exactGameTitle;
            let j = i;
            let matchingGames = [];
            if (word.length <= 4) {
                j++;
                word = word + " " + words[j]
            }
            matchingGames = await this._getAllPartiallyMatchingGames(word, null);
            let matchingStr = word;
            let nonEmptyMatchingGames;
            if (matchingGames.length > 0) {
                nonEmptyMatchingGames = matchingGames;
                // On itère en ajoutant des mots, jusqu'à ce qu'on ne trouve plus que 1 ou 0 résultat
                while (matchingGames.length > 0 && j - 1 < words.length) {
                    j++;
                    const newMatchingStr = matchingStr + " " + words[j];
                    matchingGames = await this._getAllPartiallyMatchingGames(newMatchingStr, matchingGames);
                    if (matchingGames.length > 0) {
                        matchingStr = newMatchingStr;
                        //On récupère le dernier array non vide des matchingGames
                        nonEmptyMatchingGames = matchingGames;
                    }
                }

                //On vérifie si le dernier nonEmptyMatchingGames contient le titre en entier
                if (nonEmptyMatchingGames) {
                    exactGameTitle = this._getExactMatchingGame(matchingStr, nonEmptyMatchingGames);
                    if (exactGameTitle && resultGames.indexOf(exactGameTitle) === -1) {
                        resultGames.push(exactGameTitle);
                        i = j - 1;
                    }
                }
            }
        }
        return resultGames;
    };

    _getExactMatchingGame(str: string, matchingGames: any[]): any {
        return matchingGames.find((game) => game.name.toUpperCase() === str.toUpperCase())
    };

// Looks for string occurences in matchingGames
// If matchingGames is not set, looks for string occurences in API Call
    async _getAllPartiallyMatchingGames(str: string, matchingGames: any[]): Promise<CreateGameDto[]> {
        const proxyUrl = process.env.PROXY_URL;
        const igdbKey = process.env.IGDB_API_KEY;
        const igdbUrl = process.env.IGDB_API_URL;
        const endpointName = process.env.IGDB_API_GAMES_ENDPOINTS;
        const url = `${proxyUrl}${igdbUrl}${endpointName}`;

        if (matchingGames) {
            return matchingGames.filter((game) => {
                return game.name.toUpperCase().indexOf(str.toUpperCase() + " ") === 0 || game.name.toUpperCase() === str.toUpperCase();
            })
        } else {
            // debugger;
            return axios({
                url: url,
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'user-key': igdbKey,
                    "X-Requested-With": "XMLHttpRequest"
                },
                data: `fields name, cover.url, screenshots.url, release_dates.date; sort popularity desc; where themes!= (42) & name~"${str}"* & popularity > 1; limit 50;`
            })
                .then((response) => {
                    return response.data.length === 0 ? [] : this._mappedGames(response.data);
                })
        }
    }

    private _mappedGames(games) {
        return games
            .filter((game) => {
                return game.release_dates && game.cover && game.screenshots;
            })
            .map((game) => {
                const result = {
                    ...game,
                    cover: game.cover && game.cover.url.replace('/t_thumb/', '/t_cover_big/').replace('//', 'https://'),
                    screenshot: game.screenshots && game.screenshots.length && game.screenshots[game.screenshots.length - 1].url.replace('/t_thumb/', '/t_screenshot_big/').replace('//', 'https://'),
                    releaseDate: game.release_dates && Math.min(...game.release_dates && game.release_dates.map((release_date) => {
                            return release_date.date;
                        })
                            .filter((date) => {
                                return date != null;
                            })
                    )
                };
                delete result.release_dates;
                delete result.screenshots;
                return result;
            })
    }

    private _parseDescription(str, mediaConfig) {
        str = str.toUpperCase();
        let parsed = this._removeExcludedRegex(str, mediaConfig);
        parsed = this._removeSpecialCharacters(parsed);
        parsed = this._removeEndOfParse(parsed, mediaConfig);
        parsed = this._removeUselessWhiteSpaces(parsed);
        parsed = this._removedExcludedStrings(parsed, mediaConfig);

        return parsed;
    };

    private _removedExcludedStrings(str, mediaConfig) {
        let result = str;
        mediaConfig.excludeStrings.forEach((string) => {
            result = result.replace(string.toUpperCase(), "");
        });

        return result;
    };


    private _removeExcludedRegex(str, mediaConfig) {
        let result = str;
        mediaConfig.excludeRegex.forEach((regex) => {
            result = result.replace(regex, "");
        });

        return result;
    };

    private _removeEndOfParse(str, mediaConfig) {
        let result = str;
        mediaConfig.endOfParseStrings.forEach((endOfParse) => {
            if (result.indexOf(endOfParse.toUpperCase()) > -1) {
                result = result.substring(0, result.indexOf(endOfParse.toUpperCase()));
            }
        });

        return result;
    };

    private _removeSpecialCharacters(str) {
        return str.replace(/[`~!@#$%^&*()_|+=?;«»'",.<>{}\[\]\\\/]/gi, '');
    };

    private _removeUselessWhiteSpaces(str) {
        return str.replace(/\s+(\W)/g, "$1");
    }


}