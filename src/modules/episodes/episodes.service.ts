import {
    BadRequestException,
    ForbiddenException, forwardRef,
    HttpException, Inject,
    Injectable, InternalServerErrorException, Logger,
    NotFoundException
} from "@nestjs/common";
import {InjectModel} from "@nestjs/mongoose";
import _ = require("lodash");
import {MediaConfig} from "./model/media.model";
import {asyncForEach, isObjectId} from "../../shared/utils/utils";
import {ERROR_TYPES} from "../../shared/const/error.types";
import {Model} from "mongoose";
import {Episode} from "./model/episodes.model";
import {GameGenerationService} from "../game-generation/game-generation.service";
import {CreateEpisodeDto, EpisodeDto, EpisodeResponseObject, UpdateEpisodeDto} from "./dto/episodes.dto";
import {Types} from "mongoose";
import {GamesService} from "../games/games.service";
import {EpisodeGenerationService} from "../episode-generation/episode-generation.service";

@Injectable()
export class EpisodesService {
    private logger = new Logger('EpisodesService');

    constructor(
        @InjectModel('Episode') private readonly episodeModel: Model<Episode>,
        private readonly gameGenerationService: GameGenerationService,
        @Inject(forwardRef(() => GamesService)) private readonly gamesService: GamesService,
        private readonly episodeGenerationService: EpisodeGenerationService
    ) {
    }

    /**
     * Generate all episodes from a RSS feed URL
     * @param feedUrl
     * @param config
     * @param type
     * @param logo
     * @param name
     * @param description
     * @param youtubeChannelId
     * @param youtubePlaylistId
     */
    async generateEpisodes(feedUrl: string, config: MediaConfig, type: string, logo?: string, name?: string, description?: string, youtubeChannelId?: string, youtubePlaylistId?: string) {
        this.logger.log("Starting episode generation");
        let generatedEpisodes: EpisodeDto[] = [];
        if (youtubeChannelId) {
            generatedEpisodes = await this.episodeGenerationService.generateYoutubeEpisodes(feedUrl, config, youtubeChannelId, youtubePlaylistId, name);
        } else {
            try {
                generatedEpisodes = await this.episodeGenerationService.parseRssMedia(feedUrl, config, type, logo, description, name);
            } catch (err) {
                throw new InternalServerErrorException(ERROR_TYPES.wrong_rss_format(err))
            }
        }
        const episodes = [];
        await asyncForEach(generatedEpisodes, async (generatedEp) => {
            const episode = await this.findByName(generatedEp.name);
            if (!episode) {
                const inserted = await this.episodeModel.create(generatedEp);
                episodes.push(inserted);
            }
        });
        this.logger.log(`${episodes.length} episodes generated`);

        try {
            await this._generateGamesForAllEpisodes(episodes, config);
        } catch (err) {
            throw new InternalServerErrorException(ERROR_TYPES.unable_to_parse_games(err));
        }

        return episodes.map(ep => ep.toResponseObject());
    }

    /**
     * Generate games for all episode that have not generated games yet
     */
    async generateGames() {
        const eps = await this.episodeModel.find({generatedGames: false, verified: false}).exec();
        await this._generateGamesForAllEpisodes(eps);
    }

    /**
     * Create a new episode
     * @param createEpisodeDto
     */
    async create(createEpisodeDto: CreateEpisodeDto): Promise<EpisodeResponseObject> {
        const existingEpisode = await this.findByName(createEpisodeDto.name);
        if (existingEpisode) {
            throw new ForbiddenException(ERROR_TYPES.duplicate_key(`name: ${existingEpisode.name}`))
        }
        try {
            const newEpisode = new this.episodeModel(createEpisodeDto);
            const result = await newEpisode.save();
            await this._generateGamesForAllEpisodes([result], createEpisodeDto.config);
            return result.toResponseObject();
        } catch (err) {
            if (err && err.error) {
                throw err;
            }
            throw new InternalServerErrorException(ERROR_TYPES.wrong_rss_format(err))
        }
    }

    /**
     * Update existing episode
     * @param id
     * @param updateEpisodeDto
     */
    async update(id: string, updateEpisodeDto: UpdateEpisodeDto): Promise<EpisodeResponseObject> {
        try {
            const episode = await this._findById(id);
            if (updateEpisodeDto.games) {
                const gamesToAdd = updateEpisodeDto.games.filter((game) => {
                    const stringGames = episode.games.map((game) => game.toString());
                    if (game._id) {
                        return stringGames.indexOf(game._id.toString()) === -1;
                    }
                    if (game.igdbId) {
                        return game;
                    }
                    return stringGames.indexOf(game.toString()) === -1;
                });

                const updateGameIds = updateEpisodeDto.games.map((game) => {
                    if (game._id) {
                        return game._id.toString();
                    }
                    if (game.igdbId) {
                        return null
                    } else return game.toString();
                });
                const gamesToRemove = episode.games.filter((gameId) => {
                    return updateGameIds.indexOf(gameId.toString()) === -1;
                });

                const currentGames = [];
                await asyncForEach(episode.games, async (gameId) => {
                    const game = await this.gamesService.findOne(gameId, true);
                    currentGames.push(game);
                });

                await asyncForEach(gamesToRemove, async (gameToRemove) => {
                    await this.gamesService.removeEpisodeFromGame(episode._id, gameToRemove);
                    await this.removeGameFromEpisode(gameToRemove, episode);
                });

                await asyncForEach(gamesToAdd, async (gameToAdd) => {
                    let existingGame;
                    if (gameToAdd.igdbId) {
                        existingGame = await this.gamesService.findByIgdbId(gameToAdd.igdbId);
                    } else if (gameToAdd._id) {
                        existingGame = await this.gamesService.findById(gameToAdd._id, true);
                    } else if (isObjectId(gameToAdd)) {
                        existingGame = await this.gamesService.findById(gameToAdd, true);
                    } else {
                        throw new BadRequestException(ERROR_TYPES.bad_game(gameToAdd))
                    }
                    let existingGameId;
                    if (!existingGame) {
                        const createdGame = await this.gamesService.create(gameToAdd);
                        existingGameId = createdGame._id;
                    } else {
                        existingGameId = existingGame._id;
                    }
                    await this.gamesService.pushEpisodesToGame(existingGameId, episode._id);
                    await this.pushGameToEpisode(episode._id, existingGameId);
                });
                delete updateEpisodeDto.games;
            }
            const result = await this.episodeModel.findOneAndUpdate({_id: id}, updateEpisodeDto, {new: true}).exec();
            return result.toResponseObject();
        } catch (err) {
            if (err && err.code === 11000) {
                throw new ForbiddenException(ERROR_TYPES.duplicate_key(JSON.stringify(err.keyValue)));
            } else {
                throw err;
            }
        }
    }

    /**
     * Add a game to the field games of an episode
     * @param id
     * @param gameId
     */
    async pushGameToEpisode(id: string, gameId: string) {
        if (!isObjectId(id)) {
            throw new NotFoundException(ERROR_TYPES.not_found("episode"));
        }
        if (!isObjectId(gameId)) {
            throw new NotFoundException(ERROR_TYPES.not_found("game"));
        }

        const episode = await this.episodeModel.updateOne(
            {_id: id},
            {$push: {'games': Types.ObjectId(gameId)}},
        );

        if (!episode) {
            throw new NotFoundException(ERROR_TYPES.not_found("episode"));
        }
    }

    /**
     * Find all episodes from query
     * @param query
     */
    async findAll(query): Promise<EpisodeResponseObject[]> {
        const {page, limit, ...search} = query;

        const episodeResults: Episode[] = await this.episodeModel
            .find(search)
            .sort({_updatedAt: -1})
            .skip((page - 1) * limit)
            .limit(limit)
            .exec();

        const mappedEpisodes = episodeResults.map(ep => ep.toResponseObject());

        await asyncForEach(mappedEpisodes, async (ep, i) => {
            ep.games = await this._getGamesForEpisode(ep);
            mappedEpisodes[i] = ep;
        });

        return mappedEpisodes;
    }

    /**
     * Find episode by id
     * @param id
     */
    async findOne(id: string): Promise<EpisodeResponseObject> {
        const episode = await this._findById(id);
        return episode.toResponseObject();
    }

    /**
     * find one episode by name
     * @param name
     */
    async findByName(name: string): Promise<Episode> {
        let episode;
        try {
            episode = await this.episodeModel.findOne({name}).exec();
        } catch (error) {
            throw new HttpException(error.message, error.status);
        }
        return episode;
    }

    /**
     * Delete episode
     * @param id
     */
    async delete(id: string): Promise<any> {
        if (!isObjectId(id)) {
            throw new NotFoundException(ERROR_TYPES.not_found("episode"));
        }
        const result = await this.episodeModel.deleteOne({_id: id}).exec();
        if (result.n === 0) {
            throw new NotFoundException(ERROR_TYPES.not_found("episode"));
        }
    }

    /**
     * Delete many episode (must be given a filter)
     * @param deleteDto
     */
    async deleteMany(deleteDto): Promise<any> {
        if (!deleteDto || _.isEmpty(deleteDto)) {
            throw new BadRequestException(ERROR_TYPES.validation_no_body);
        }
        return await this.episodeModel.deleteMany(deleteDto).exec();

    }

    /**
     * Remove one game from an episode
     * @param gameToRemove
     * @param episode
     */
    async removeGameFromEpisode(gameToRemove, episode) {
        episode.games = episode.games.filter(game => game.toString() !== gameToRemove.toString());
        await episode.save();
    }

    /**
     * Find all media without duplicate
     */
    async findAllMedias() {
        return this.episodeModel.aggregate([
            {
                $group: {
                    _id: '$media.name',
                    name: {'$first': '$media.name'},
                    config: {'$first': '$media.config'},
                    feedUrl: {'$first': '$media.feedUrl'},
                    type: {'$first': '$media.type'},
                    logo: {'$first': '$media.logo'},
                    description: {'$first': '$media.description'},
                }
            }
        ]).exec();
    }

    /**
     * Find episode by id
     * @param id
     * @private
     */
    private async _findById(id): Promise<Episode> {
        if (!isObjectId(id)) {
            throw new NotFoundException(ERROR_TYPES.not_found("episode"));
        }
        let episode;
        try {
            episode = await this.episodeModel.findById(Types.ObjectId(id)).exec();
        } catch (error) {
            throw new HttpException(error.message, error.status);
        }
        if (!episode) {
            throw new NotFoundException(ERROR_TYPES.not_found("episode"));
        }
        return episode;
    }


    /**
     * Generate all games for all given episodes, and reference the games in the episode and the other way around
     * @param episodes
     * @param config
     */
    private async _generateGamesForAllEpisodes(episodes: Episode[], config?: MediaConfig) {
        this.logger.log("Generating games...");
        await asyncForEach(episodes, async (episode) => {
            await this.gameGenerationService.fetchAndPopulateGames(episode, config || episode.media.config)

            const total = episodes.length;
            const index = episodes.map(ep => ep._id).findIndex(ep => ep === episode._id) + 1;
            const percentage = Math.round((index / total) * 20);
            const percentageLog = "█".repeat(percentage) + "░".repeat((20 - percentage)) + `   ${index}/${total}`;
            this.logger.log(percentageLog);
        });
        this.logger.log("All games have been generated for this media");
    }

    /**
     * Get game objects for episode
     * @param episode
     * @private
     */
    private async _getGamesForEpisode(episode) {
        const gamesId = episode.games;
        const games = [];
        await asyncForEach(gamesId, async (gameId) => {
            try {
                const game = await this.gamesService.findOne(gameId, false);
                games.push(game);
            } catch (err) {
                if (!err || !err.response || err.response.error != ERROR_TYPES.not_found("").error) {
                    throw err;
                }
            }
        });
        return games;
    }
}