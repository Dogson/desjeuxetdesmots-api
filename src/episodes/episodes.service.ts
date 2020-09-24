import {
    ForbiddenException, forwardRef,
    HttpException, Inject,
    Injectable, InternalServerErrorException, Logger,
    NotFoundException
} from "@nestjs/common";

import {InjectModel} from "@nestjs/mongoose";

import {MediaConfig} from "./model/media.model";
import {asyncForEach, isObjectId} from "../shared/utils/utils";
import {ERROR_TYPES} from "../shared/const/error.types";
import {parseRssMedia} from "./helpers/rss.parser";
import {Model} from "mongoose";
import {Episode} from "./model/episodes.model";
import {GameGenerationService} from "../game-generation/game-generation.service";
import {CreateEpisodeDto, EpisodeResponseObject, UpdateEpisodeDto} from "./dto/episodes.dto";
import {Types} from "mongoose";
import {GamesService} from "../games/games.service";

@Injectable()
export class EpisodesService {
    private logger = new Logger('EpisodesService');

    constructor(
        @InjectModel('Episode') private readonly episodeModel: Model<Episode>,
        private readonly gameGenerationService: GameGenerationService,
        @Inject(forwardRef(() => GamesService)) private readonly gamesService: GamesService
    ) {
    }

    /**
     * Generate all episodes from a RSS feed URL
     */
    async generateEpisodes(feedUrl, config) {
        try {
            const generatedEpisodes = await parseRssMedia(feedUrl, config);
            const episodes = await this.episodeModel.insertMany(generatedEpisodes);
            this._generateGamesForAllEpisodes(episodes, config);
            return episodes.map(ep => ep.toResponseObject());
        } catch (err) {
            if (err && err.code === 11000) {
                throw new ForbiddenException(ERROR_TYPES.duplicate_key(JSON.stringify(err.keyValue)));
            }
            if (err && err.error) {
                throw err;
            }
            throw new InternalServerErrorException(ERROR_TYPES.wrong_rss_format(err))
        }
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
            const episode = await this._findAndUpdate(id, updateEpisodeDto);
            const result = await episode.save();
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
     * Find all episodes from query
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

    private async _findAndUpdate(id: string, updateEpisodeDto: UpdateEpisodeDto): Promise<Episode> {
        if (!isObjectId(id)) {
            throw new NotFoundException(ERROR_TYPES.not_found("episode"));
        }
        const episode = await this.episodeModel.findOneAndUpdate({_id: id}, updateEpisodeDto, {new: true});

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
    private async _generateGamesForAllEpisodes(episodes: Episode[], config: MediaConfig) {
        await asyncForEach(episodes, async (episode) => {
            await this.gameGenerationService.fetchAndPopulateGames(episode, config)
        });
        this.logger.log("All games have been generated for this media");
    }


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