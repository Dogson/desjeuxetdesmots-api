import {Body, Controller, Delete, Get, Logger, Param, Post, Put, UsePipes} from '@nestjs/common';
import {GamesService} from "./games.service";
import {CreateGameDto, GetGameDto} from "./dto/games.dto";
import {ValidationPipe} from "../shared/validation.pipe";

@Controller('games')
export class GamesController {
    private logger = new Logger('IdeaController');

    constructor(private readonly gamesService: GamesService) {

    }

    @Post()
    @UsePipes(new ValidationPipe())
    addGame(@Body() createGameDto: CreateGameDto): Promise<GetGameDto> {
        this.logger.log(JSON.stringify(createGameDto));
        return this.gamesService.insertGame(createGameDto);
    }

    @Put(':id')
    @UsePipes(new ValidationPipe())
    updateGame(@Param('id') id: string, @Body() updateGameDto: Partial<CreateGameDto>): Promise<GetGameDto> {
        this.logger.log(JSON.stringify(updateGameDto));
        return this.gamesService.updateGame(id, updateGameDto);
    }

    @Get()
    findAllGames(): Promise<GetGameDto[]> {
        return this.gamesService.findAllGames();
    }

    @Get(':id')
    findOneGame(@Param('id') id: string): Promise<GetGameDto> {
        return this.gamesService.findOneGame(id);
    }

    @Delete(':id')
    async deleteGame(@Param('id') id: string): Promise<any> {
        await this.gamesService.deleteGame(id);
        return null;
    }
}
