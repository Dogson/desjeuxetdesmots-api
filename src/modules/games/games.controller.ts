import {Body, Controller, Delete, Get, Logger, Param, Post, Put, Query, UseGuards, UsePipes} from '@nestjs/common';
import {GamesService} from "./games.service";
import {CreateGameDto, GameResponseObject, UpdateGameDto} from "./dto/games.dto";
import {ValidationPipe} from "../../shared/handler/validation.pipe";
import {DEFAULT_GAME_QUERY, GAME_SEARCHABLE_INDEX, IGameQuery} from "./query/games.query.interface";
import {_parseDefaultQueryTypes} from "../../shared/const/default.query.interface";
import {removeEmptyAttrFromObj} from "../../shared/utils/utils";
import {AuthGuard} from "../../shared/handler/auth.guard";

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
    @UseGuards(new AuthGuard())
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
    @UseGuards(new AuthGuard())
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
        query = this._mapQueryWithDefault(query);
        query = this._parseQueryTypes(query);
        query = this._mapQuerySearchableIndex(query);
        return this.gamesService.findAll(query);
    }

    /**
     * Get /games/:id
     * @param id
     */
    @Get(':id')
    async findOneGame(@Param('id') id: string): Promise<GameResponseObject> {
        return this.gamesService.findOne(id, true);
    }

    /**
     * DELETE /games/:id
     * @param id
     */
    @Delete(':id')
    @UseGuards(new AuthGuard())
    async deleteGame(@Param('id') id: string): Promise<any> {
        await this.gamesService.delete(id);
        return null;
    }

    private _mapQueryWithDefault(query: IGameQuery): IGameQuery {
        query = removeEmptyAttrFromObj(query);
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
        return {
            ...query,
            filters: {
                ...JSON.parse(String(query.filters)),
                'verified': true,
            }
        }
    }

    private _mapQuerySearchableIndex(query: IGameQuery): IGameQuery {
        if (!query[GAME_SEARCHABLE_INDEX])
            return query;
        query.searchableIndex = new RegExp(query[GAME_SEARCHABLE_INDEX].toUpperCase(), 'i');
        delete query[GAME_SEARCHABLE_INDEX];

        return query;
    }
}
