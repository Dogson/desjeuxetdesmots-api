import {Body, Controller, Delete, Get, Param, Post, Put} from '@nestjs/common';
import {GamesService} from "./games.service";
import {CreateGameDto, GetGameDto} from "./dto/games.dto";

@Controller('games')
export class GamesController {
    constructor(private readonly gamesService: GamesService) {

    }

    @Post()
    addGame(@Body() createGameDto: CreateGameDto): Promise<GetGameDto> {
        return this.gamesService.insertGame(createGameDto);
    }

    @Put(':id')
    updateGame(@Param('id') id: string, @Body() updateGameDto: Partial<CreateGameDto>): Promise<GetGameDto> {
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
