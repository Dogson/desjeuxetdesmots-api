import {
    BadRequestException,
    ForbiddenException,
    forwardRef,
    HttpException,
    Inject,
    Injectable,
    InternalServerErrorException,
    NotFoundException
} from "@nestjs/common";

import {CreateGameDto, GameResponseObject, SearchResponseObject, UpdateGameDto} from "./dto/games.dto";
import {InjectModel} from "@nestjs/mongoose";

import {Game} from "./model/games.model";
import {asyncForEach, isObjectId} from "../../shared/utils/utils";
import {ERROR_TYPES} from "../../shared/const/error.types";
import {Model, Types} from "mongoose";
import {EpisodesService} from "../episodes/episodes.service";
import {IGameQuery} from "./query/games.query.interface";

@Injectable()
export class GamesService {
    constructor(
        @InjectModel('Game') private readonly gameModel: Model<Game>,
        @Inject(forwardRef(() => EpisodesService)) private readonly episodesService: EpisodesService,
    ) {
    }

    /**
     * Create a new game
     * @param createGameDto
     */
    async create(createGameDto: CreateGameDto): Promise<GameResponseObject> {
        try {
            const newGame = new this.gameModel(createGameDto);
            const result = await newGame.save();
            return result.toResponseObject();
        } catch (err) {
            if (err && err.code === 11000) {
                throw new ForbiddenException(ERROR_TYPES.duplicate_key(JSON.stringify(err.keyValue)))
            }
            if (err && err.error) {
                throw err;
            }
            throw new InternalServerErrorException(ERROR_TYPES.wrong_rss_format(err))
        }
    }

    /**
     * Update existing game
     * @param id
     * @param updateGameDto
     */
    async update(id: string, updateGameDto: UpdateGameDto): Promise<GameResponseObject> {
        const game = await this._findAndUpdate(id, updateGameDto);
        const result = await game.save();
        return result.toResponseObject();
    }

    async pushEpisodesToGame(id: string, episodeId: string) {
        if (!isObjectId(id)) {
            throw new NotFoundException(ERROR_TYPES.not_found("game"));
        }
        if (!isObjectId(episodeId)) {
            throw new NotFoundException(ERROR_TYPES.not_found("episode"));
        }

        const game = await this.gameModel.updateOne(
            {_id: id},
            {$push: {'episodes': Types.ObjectId(episodeId)}},
        );

        if (!game) {
            throw new NotFoundException(ERROR_TYPES.not_found("game"));
        }
    }

    /**
     * Search games and medias
     */
    async findAllGamesAndMedias(query: IGameQuery): Promise<SearchResponseObject> {
        const {page, limit, filters, ...search} = query;

        const match = {
            ...search
        };
        if (filters) {
            match.episodes = {
                $elemMatch: filters
            }
        }

        const gameQuery = this.gameModel.aggregate([
            {
                $lookup: {
                    from: 'episodes',
                    localField: 'episodes',
                    foreignField: '_id',
                    as: 'episodes'
                }
            },
            {
                $match: match
            },
            {$sort: {_updatedAt: -1}},
            {$skip: (page - 1) * limit},
            {$limit: limit}
        ])


        const gameResults: Game[] = await gameQuery.exec();
        const mediaResults = search.searchableIndex ? await this.episodesService.findAllMediasBySearch(search.searchableIndex) : [];

        return {
            games: gameResults.filter(game => game.episodes.length > 0),
            medias: mediaResults
        };
    }

    /**
     * Find game by id
     * @param id
     * @param withEpisodes
     */
    async findOne(id: string, withEpisodes: boolean): Promise<GameResponseObject> {
        const game = await this.findById(id, withEpisodes);
        const gameRO = {...game.toResponseObject()};
        if (withEpisodes) {
            gameRO.episodes = await this._getEpisodesFromGame(game);
        }
        return gameRO;
    }

    /**
     * Delete game
     * @param id
     */
    async delete(id: string): Promise<any> {
        if (!isObjectId(id)) {
            throw new NotFoundException(ERROR_TYPES.not_found("game"));
        }
        const result = await this.gameModel.deleteOne({_id: id}).exec();
        if (result.n === 0) {
            throw new NotFoundException(ERROR_TYPES.not_found("game"));
        }
    }

    async findByIgdbId(igdbId: string): Promise<Game> {
        let game;
        try {
            game = await this.gameModel.findOne({igdbId}).exec();
            return game;
        } catch (error) {
            throw new HttpException(error.message, error.status);
        }
    }

    async findById(id: string, withEpisodes: boolean): Promise<Game> {
        if (!isObjectId(id)) {
            throw new NotFoundException(ERROR_TYPES.not_found("game"));
        }
        let projection;
        if (!withEpisodes) {
            projection = {episodes: 0}
        }

        let game;
        try {
            game = await this.gameModel.findById(id, projection).exec();
        } catch (error) {
            throw new HttpException(error.message, error.status);
        }
        if (!game) {
            throw new NotFoundException(ERROR_TYPES.not_found("game"));
        }
        return game;
    }

    /**
     * Find episodes doc from a game
     * @param game
     * @private
     */
    private async _getEpisodesFromGame(game) {
        const episodesId = game.episodes;
        const episodes = [];
        await asyncForEach(episodesId, async (episodeId) => {
            try {
                const episode = await this.episodesService.findOne(episodeId);
                episodes.push(episode);
            } catch (err) {
                if (!err || !err.response || err.response.error != ERROR_TYPES.not_found("").error) {
                    throw err;
                }
            }
        });
        return episodes;
    }

    private async _findAndUpdate(id: string, updateGameDto: UpdateGameDto): Promise<Game> {
        if (!isObjectId(id)) {
            throw new NotFoundException(ERROR_TYPES.not_found("game"));
        }
        const game = await this.gameModel.findOneAndUpdate({_id: id}, updateGameDto, {new: true});

        if (!game) {
            throw new NotFoundException(ERROR_TYPES.not_found("game"));
        }
        return game;
    }

    async removeEpisodeFromGame(episodeToRemove, game) {
        const gameDoc = await this.findById(game, true);
        if (!gameDoc) {
            throw new BadRequestException(ERROR_TYPES.not_found("game"));
        }
        const newEpisodes = gameDoc.episodes.filter(ep => ep.toString() !== episodeToRemove.toString());
        if (newEpisodes.length === 0) {
            await gameDoc.deleteOne();
        } else {
            gameDoc.episodes = newEpisodes;
            await gameDoc.save();
        }
    }
}