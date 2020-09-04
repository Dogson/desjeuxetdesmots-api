import {Injectable, NotFoundException} from "@nestjs/common";

import {CreateGameDto, GetGameDto} from "./dto/games.dto";
import {InjectModel} from "@nestjs/mongoose";
import {Model} from "mongoose";

import {Game} from "./games.model";

@Injectable()
export class GamesService {
    private games: Game[] = [];

    constructor(
        @InjectModel('Game') private readonly gameModel: Model<Game>
    ) {
    }

    async insertGame(createGameDto: CreateGameDto): Promise<GetGameDto> {
        const newGame = new this.gameModel({
            lastUpdated: new Date(),
            ...createGameDto
        });
        const result = await newGame.save();
        return this.mapResponseToData(result);
    }

    async updateGame(id: string, updateGameDto: Partial<CreateGameDto>): Promise<GetGameDto> {
        const game = await this.findAndUpdateGame(id, updateGameDto);
        const result = await game.save();
        return this.mapResponseToData(result);
    }

    async findAllGames(): Promise<GetGameDto[]> {
        const gameResults: Game[] = await this.gameModel.find().exec();
        return gameResults.map(game => this.mapResponseToData(game))
    }

    async findOneGame(id: string): Promise<GetGameDto> {
        const game = await this.findGame(id);
        return this.mapResponseToData(game);
    }

    async deleteGame(id: string): Promise<any> {
        const result = await this.gameModel.deleteOne({_id: id}).exec();
        if (result.n === 0) {
            throw new NotFoundException('Could not find game.');
        }
    }

    private async findGame(id: string): Promise<Game> {
        let game;
        try {
            game = await this.gameModel.findById(id).exec();
        } catch (error) {
            throw new NotFoundException('Could not find game.');
        }
        if (!game) {
            throw new NotFoundException('Could not find game.');
        }
        return game;
    }

    private async findAndUpdateGame(id: string, updateGameDto: Partial<CreateGameDto>): Promise<Game> {
        let game;
        try {
            const updatedProps = {
                ...updateGameDto,
                lastUpdated: new Date()
            }
            game = await this.gameModel.findOneAndUpdate({_id: id}, updatedProps, {new: true});
        } catch (error) {
            throw new NotFoundException('Could not update game.');
        }
        if (!game) {
            throw new NotFoundException('Could not find game.');
        }
        return game;
    }

    private mapResponseToData(gameResult: Game): GetGameDto {
        const {_id, lastUpdated, name, cover, screenshot, releaseDate} = gameResult;
        return {
            _id,
            lastUpdated,
            name,
            cover,
            screenshot,
            releaseDate
        }
    }
}