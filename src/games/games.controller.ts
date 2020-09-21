import {Body, Controller, Delete, Get, Logger, Param, Post, Put, Query, UsePipes} from '@nestjs/common';
import {GamesService} from "./games.service";
import {CreateGameDto, GameResponseObject, UpdateGameDto} from "./dto/games.dto";
import {ValidationPipe} from "../shared/handler/validation.pipe";
import {DEFAULT_GAME_QUERY, IGameQuery} from "./query/games.query.interface";
import {_parseDefaultQueryTypes} from "../shared/const/default.query.interface";

@Controller('games')
export class GamesController {
    private logger = new Logger('GameController');

    constructor(private readonly gamesService: GamesService) {

    }

    /**
     * POST /games
     * @param createGameDto : request body
     */
    @Post()
    @UsePipes(new ValidationPipe())
    async addGame(@Body() createGameDto: CreateGameDto): Promise<GameResponseObject> {
        this.logger.log(JSON.stringify(createGameDto));
        return this.gamesService.create(createGameDto);
    }

    /**
     * PUT /games/:id
     * @param id
     * @param updateGameDto : request body ; fields to update
     */
    @Put(':id')
    @UsePipes(new ValidationPipe())
    async updateGame(@Param('id') id: string, @Body() updateGameDto: UpdateGameDto): Promise<GameResponseObject> {
        this.logger.log(JSON.stringify(updateGameDto));
        return this.gamesService.update(id, updateGameDto);
    }

    /**
     * GET /games
     */
    @Get()
    async findAllGames(@Query() query: IGameQuery): Promise<GameResponseObject[]> {
        console.log(query);
        query = this._mapQueryWithDefault(query);
        console.log(query);
        query = this._parseQueryTypes(query);
        console.log(query);
        return this.gamesService.findAll(query);
    }

    /**
     * Get /games/:id
     * @param id
     */
    @Get(':id')
    async findOneGame(@Param('id') id: string): Promise<GameResponseObject> {
        return this.gamesService.findOne(id);
    }

    /**
     * DELETE /games/:id
     * @param id
     */
    @Delete(':id')
    async deleteGame(@Param('id') id: string): Promise<any> {
        await this.gamesService.delete(id);
        return null;
    }

    private _mapQueryWithDefault(query: IGameQuery): IGameQuery {
        return {
            ...DEFAULT_GAME_QUERY,
            ...query
        }
    }

    private _parseQueryTypes(query: IGameQuery): IGameQuery {
        return {
            ...this._parseGameQueryTypes(query),
            ..._parseDefaultQueryTypes(query)
        }
    }

    private _parseGameQueryTypes(query: IGameQuery): IGameQuery {
        return query;
    }
}
