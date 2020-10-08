import {ForbiddenException, forwardRef, Inject, Injectable, InternalServerErrorException, Logger} from "@nestjs/common";
import {CreateGameDto, GameResponseObject} from "../games/dto/games.dto";
import {InjectModel} from "@nestjs/mongoose";
import {Model, Types} from "mongoose";
import {Game} from "../games/model/games.model";
import {GamesService} from "../games/games.service";
import {ERROR_TYPES} from "../../shared/const/error.types";
import {asyncForEach} from "../../shared/utils/utils";
import {Episode} from "../episodes/model/episodes.model";
import {MediaConfig} from "../episodes/model/media.model";
import {IgdbService} from "../igdb/igdb.service";

@Injectable()
export class GameGenerationService {
    private logger = new Logger('GameGenerationService');

    constructor(
        @InjectModel('Game') private readonly gameModel: Model<Game>,
        @Inject(forwardRef(() => GamesService)) private readonly gamesService: GamesService,
        @Inject(forwardRef(() => IgdbService)) private readonly igdbService: IgdbService
    ) {
    }

    /**
     * For a given episode, fetch and populate related games and update episode with said games
     * @param episode
     * @param mediaConfig
     */
    public async fetchAndPopulateGames(episode: Episode, mediaConfig: MediaConfig) {
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
        await episode.save();
    }

    /**
     * Get a list of games from a string
     * @param str
     * @param mediaConfig
     * @private
     */
    private async _getVideoGamesFromString(str: string, mediaConfig: MediaConfig): Promise<CreateGameDto[]> {
        str = this._parseDescription(str, mediaConfig);
        const words = str.split(/\s+/);
        return await this._getGamesFromArray(words);
    }

    /**
     * Get a list of games from an array of words
     * @param words
     * @private
     */
    private async _getGamesFromArray(words: string[]): Promise<CreateGameDto[]> {
        const token = await this.igdbService.getTwitchToken();
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
            matchingGames = await this._getAllPartiallyMatchingGames(word, null, token);
            let matchingStr = word;
            let nonEmptyMatchingGames;
            if (matchingGames.length > 0) {
                nonEmptyMatchingGames = matchingGames;
                // On itère en ajoutant des mots, jusqu'à ce qu'on ne trouve plus que 1 ou 0 résultat
                while (matchingGames.length > 0 && j - 1 < words.length) {
                    j++;
                    const newMatchingStr = matchingStr + " " + words[j];
                    matchingGames = await this._getAllPartiallyMatchingGames(newMatchingStr, matchingGames, token);
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
     * @param token
     * @private
     */
    async _getAllPartiallyMatchingGames(str: string, matchingGames: any[], token: string): Promise<CreateGameDto[]> {
        if (matchingGames) {
            return matchingGames.filter((game) => {
                return game.name.toUpperCase().indexOf(str.toUpperCase() + " ") === 0 || game.name.toUpperCase() === str.toUpperCase();
            })
        } else {
            try {
                return await this.igdbService.executeIgdbQuery(str, false, 50, token)
            } catch (err) {
                throw new ForbiddenException(ERROR_TYPES.unable_to_execute_igdb_query(err))
            }
        }
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