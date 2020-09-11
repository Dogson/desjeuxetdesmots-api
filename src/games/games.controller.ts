import {Body, Controller, Delete, Get, Logger, Param, Post, Put, UsePipes} from '@nestjs/common';
import {GamesService} from "./games.service";
import {CreateGameDto, GetGameDto, UpdateGameDto} from "./games.dto";
import {ValidationPipe} from "../shared/handler/validation.pipe";

@Controller('games')
export class GamesController {
    private logger = new Logger('GameController');

    constructor(private readonly gamesService: GamesService) {

    }

    @Post()
    @UsePipes(new ValidationPipe())
    addGame(@Body() createGameDto: CreateGameDto): Promise<GetGameDto> {
        this.logger.log(JSON.stringify(createGameDto));
        return this.gamesService.create(createGameDto);
    }

    @Put(':id')
    @UsePipes(new ValidationPipe())
    updateGame(@Param('id') id: string, @Body() updateGameDto: UpdateGameDto): Promise<GetGameDto> {
        this.logger.log(JSON.stringify(updateGameDto));
        return this.gamesService.update(id, updateGameDto);
    }

    @Get()
    findAllGames(): Promise<GetGameDto[]> {
        return this.gamesService.findAll();
    }

    @Get(':id')
    findOneGame(@Param('id') id: string): Promise<GetGameDto> {
        return this.gamesService.findOne(id);
    }

    @Delete(':id')
    async deleteGame(@Param('id') id: string): Promise<any> {
        await this.gamesService.delete(id);
        return null;
    }
}
