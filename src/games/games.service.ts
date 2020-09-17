import {HttpException, Injectable, NotFoundException} from "@nestjs/common";

import {CreateGameDto, GameResponseObject, UpdateGameDto} from "./dto/games.dto";
import {InjectModel} from "@nestjs/mongoose";

import {Game} from "./model/games.model";
import {isObjectId} from "../shared/utils/utils";
import {ERROR_TYPES} from "../shared/const/error.types";
import {Model} from "mongoose";

@Injectable()
export class GamesService  {
    constructor(
        @InjectModel('Game') private readonly gameModel: Model<Game>
    ) {
    }

    /**
     * Create a new game
     * @param createGameDto
     */
    async create(createGameDto: CreateGameDto): Promise<GameResponseObject> {
        const newGame = new this.gameModel(createGameDto);
        const result = await newGame.save();
        return result.toResponseObject();
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

    /**
     * Find all games
     */
    async findAll(): Promise<GameResponseObject[]> {
        const gameResults: Game[] = await this.gameModel.find().exec();
        return gameResults.map(game => game.toResponseObject())
    }

    /**
     * Find game by id
     * @param id
     */
    async findOne(id: string): Promise<GameResponseObject> {
        const game = await this._find(id);
        return game.toResponseObject();
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

    private async _find(id: string): Promise<Game> {
        if (!isObjectId(id)) {
            throw new NotFoundException(ERROR_TYPES.not_found("game"));
        }
        let game;
        try {
            game = await this.gameModel.findById(id).exec();
        } catch (error) {
            throw new HttpException(error.message, error.status);
        }
        if (!game) {
            throw new NotFoundException(ERROR_TYPES.not_found("game"));
        }
        return game;
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
}