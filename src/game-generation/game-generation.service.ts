import {
    ForbiddenException, forwardRef, Inject,
    Injectable, InternalServerErrorException, Logger
} from "@nestjs/common";
// import {Media, MediaConfig} from "../media/model/media.model";
import {CreateGameDto, GameResponseObject} from "../games/dto/games.dto";
import axios from "axios";
import {InjectModel} from "@nestjs/mongoose";
import {Model} from "mongoose";
import {Game} from "../games/model/games.model";
import {GamesService} from "../games/games.service";
import {ERROR_TYPES} from "../shared/const/error.types";
import {asyncForEach} from "../shared/utils/utils";
import {Episode} from "../episodes/model/episodes.model";
import {MediaConfig} from "../episodes/model/media.model";
import {Types} from "mongoose";

@Injectable()
export class GameGenerationService {
    private logger = new Logger('GameGenerationService');

    constructor(
        @InjectModel('Game') private readonly gameModel: Model<Game>,
        @Inject(forwardRef(() => GamesService)) private readonly gamesService: GamesService
    ) {
    }

    /**
     * For a given episode, fetch and populate related games and update episode with said games
     * @param episode
     * @param mediaConfig
     */
    public async fetchAndPopulateGames(episode: Episode, mediaConfig: MediaConfig) {
        this.logger.log(`Starting populating game for episode : ${episode.name}`);
        const stringToParse = episode[mediaConfig.parseProperty];
        try {
            const games = await this._getVideoGamesFromString(stringToParse, mediaConfig);
            return await this.createAndUpdateGamesAndEpisode(games, episode);

        } catch (err) {
            throw new InternalServerErrorException(ERROR_TYPES.unable_to_parse_games(err))
        }
    }

    async createAndUpdateGamesAndEpisode(games: CreateGameDto[], episode: Episode) {
        try {
            const gamesCreated = [];
            await asyncForEach(games, async (game) => {
                gamesCreated.push(await this.createGameIfNotExists(game));
            });

            await asyncForEach(gamesCreated, async (game: GameResponseObject) => {
                await this.addEpisodeToGame(game._id, episode._id);
            });

            const gamesId = gamesCreated.map(game => game._id);
            return await this.addGamesToEpisode(episode, gamesId);
        } catch (err) {
            this.logger.error(err)
        }
    }

    public async createGameIfNotExists(game: CreateGameDto): Promise<GameResponseObject> {
        const existingGame = await this.gamesService.findByIgdbId(game.igdbId);
        if (existingGame) {
            this.logger.log(`Skipped creation for game ${existingGame.name} : game already exists`);
            return existingGame.toResponseObject();
        }

        return await this.gamesService.create(game);
    }

    /**
     * Add episode to array of episodes in the game doc
     * @param gameId
     * @param episodeId
     */
    public async addEpisodeToGame(gameId: string, episodeId: string) {
        await this.gamesService.pushEpisodesToGame(gameId, episodeId);
    }

    /**
     * Add games ids array to episode
     * @param episode
     * @param gamesId
     */
    public async addGamesToEpisode(episode: Episode, gamesId: string[]) {

        gamesId.forEach((gameId) => {
            if (episode.games.map(id => id.toString()).indexOf(gameId) === -1) {
                episode.games.push(new Types.ObjectId(gameId));
            }
        });
        episode.generatedGames = true;
        this.logger.log(`Episode ${episode.name} has generated ${gamesId.length}O games.`);
        await episode.save();
    }

    /**
     * Get a list of games from a string
     * @param str
     * @param mediaConfig
     * @private
     */
    private async _getVideoGamesFromString(str: string, mediaConfig: MediaConfig): Promise<CreateGameDto[]> {
        let games: CreateGameDto[] = [];
        let ignoreEpisode = false;
        mediaConfig.ignoreEpisode.forEach((ignoreStr) => {
            if (str.indexOf(ignoreStr) > -1) {
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

    /**
     * Get a list of games from an array of words
     * @param words
     * @private
     */
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

    /**
     * Return an IGDB game if the string match any of the string in the matchingGames array
     * @param str
     * @param matchingGames
     * @private
     */
    _getExactMatchingGame(str: string, matchingGames: any[]): any {
        return matchingGames.find((game) => game.name.toUpperCase() === str.toUpperCase())
    };

    /**
     * Looks for string occurence in matching games
     * If matchingGames is null, looks for string occurences in IGDB API
     * @param str
     * @param matchingGames
     * @private
     */
    async _getAllPartiallyMatchingGames(str: string, matchingGames: any[]): Promise<CreateGameDto[]> {
        const igdbKey = process.env.IGDB_API_KEY;
        const igdbUrl = process.env.IGDB_API_URL;
        const endpointName = process.env.IGDB_API_GAMES_ENDPOINTS;
        const url = `${igdbUrl}${endpointName}`;
        if (matchingGames) {
            return matchingGames.filter((game) => {
                return game.name.toUpperCase().indexOf(str.toUpperCase() + " ") === 0 || game.name.toUpperCase() === str.toUpperCase();
            })
        } else {
            try {
                const response = await axios({
                    url: url,
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'user-key': igdbKey,
                        "X-Requested-With": "XMLHttpRequest"
                    },
                    data: `fields name, cover.url, screenshots.url, release_dates.date; sort popularity desc; where themes!= (42) & name~"${str}"* & popularity > 1; limit 50;`
                });
                return response.data.length === 0 ? [] : this._mappedGames(response.data);
            } catch (err) {
                throw new ForbiddenException(ERROR_TYPES.unable_to_connect_to_igdb(err))
            }
        }
    }

    /**
     * Map IGDB games to CreateGameDTO
     * @param games
     * @private
     */
    private _mappedGames(games): CreateGameDto[] {
        return games
            .filter((game) => {
                return game.release_dates && game.cover && game.screenshots;
            })
            .map((game) => {
                const result = {
                    ...game,
                    igdbId: game.id,
                    cover: game.cover && game.cover.url.replace('/t_thumb/', '/t_cover_big/').replace('//', 'https://'),
                    screenshot: game.screenshots && game.screenshots.length && game.screenshots[game.screenshots.length - 1].url.replace('/t_thumb/', '/t_screenshot_big/').replace('//', 'https://'),
                    releaseDate: game.release_dates && new Date(Math.min(...game.release_dates && game.release_dates.map((release_date) => {
                            return release_date.date;
                        })
                            .filter((date) => {
                                return date != null;
                            })
                    ) * 1000)
                };
                delete result.release_dates;
                delete result.screenshots;
                delete game.id;
                return result;
            })
    }

    /**
     * Parse description containing games to remove all useless strings and chars
     * @param str
     * @param mediaConfig
     * @private
     */
    private _parseDescription(str, mediaConfig) {
        str = str.toUpperCase();
        let parsed = this._removeExcludedRegex(str, mediaConfig);
        parsed = this._removeSpecialCharacters(parsed);
        parsed = this._removeEndOfParse(parsed, mediaConfig);
        parsed = this._removeUselessWhiteSpaces(parsed);
        parsed = this._removedExcludedStrings(parsed, mediaConfig);

        return parsed;
    };

    /**
     * Remove excluded strings
     * @param str
     * @param mediaConfig
     * @private
     */
    private _removedExcludedStrings(str, mediaConfig) {
        let result = str;
        mediaConfig.excludeStrings.forEach((string) => {
            result = result.replace(string.toUpperCase(), "");
        });

        return result;
    };

    /**
     * Remove strings containing regex
     * @param str
     * @param mediaConfig
     * @private
     */
    private _removeExcludedRegex(str, mediaConfig) {
        let result = str;
        mediaConfig.excludeRegex.forEach((regex) => {
            result = result.replace(regex, "");
        });

        return result;
    };

    /**
     * Remove all string after "endOfParse" strings
     * @param str
     * @param mediaConfig
     * @private
     */
    private _removeEndOfParse(str, mediaConfig) {
        let result = str;
        mediaConfig.endOfParseStrings.forEach((endOfParse) => {
            if (result.indexOf(endOfParse.toUpperCase()) > -1) {
                result = result.substring(0, result.indexOf(endOfParse.toUpperCase()));
            }
        });

        return result;
    };

    /**
     * Remove all special characters
     * @param str
     * @private
     */
    private _removeSpecialCharacters(str) {
        return str.replace(/[`~!@#$%^&*()_|+=?;«»'",.<>{}\[\]\\\/]/gi, '');
    };

    /**
     * Remove useless white spaces
     * @param str
     * @private
     */
    private _removeUselessWhiteSpaces(str) {
        return str.replace(/\s+(\W)/g, "$1");
    }


}