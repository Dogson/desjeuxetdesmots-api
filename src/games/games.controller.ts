import {Body, Controller, Delete, Get, Param, Post, Put} from '@nestjs/common';
import {GamesService} from "./games.service";
import {CreateGameDto} from "./dto/create-game.dto";
import {Game} from "./games.model";

@Controller('games')
export class GamesController {
    constructor(private readonly gamesService: GamesService) {

    }

    @Post()
    addGame(@Body() createGameDto: CreateGameDto): Game {
        return this.gamesService.insertGame(createGameDto);
    }

    @Put(':id')
    updateGame(@Param('id') id: string, @Body() updateGameDto: Partial<CreateGameDto>): Game {
        return this.gamesService.updateGame(id, updateGameDto);
    }

    @Get()
    findAllGames(): Game[] {
        return this.gamesService.findAllGames();
    }

    @Get(':id')
    findOneGame(@Param('id') id: string): Game {
        return this.gamesService.findOneGame(id);
    }

    @Delete(':id')
    deleteGame(@Param('id') id: string): any {
        return this.gamesService.deleteGame(id);
    }
}
