import {Injectable, NotFoundException} from "@nestjs/common";

import {Game} from "./games.model";
import {CreateGameDto} from "./dto/create-game.dto";

@Injectable()
export class GamesService {
    games: Game[] = [];

    insertGame(createGameDto: CreateGameDto): Game {
        const {name, cover, screenshot, releaseDate} = createGameDto;
        const newId = this.games.length + 1;
        const newGame = new Game(newId.toString(), new Date(), name, cover, screenshot, releaseDate);
        this.games.push(newGame);
        return newGame;
    }

    updateGame(id: string, updateGameDto: Partial<CreateGameDto>): Game {
        const {index, game} = this.findGame(id);
        this.games[index] = {
            ...game,
            ...updateGameDto,
            lastUpdated: new Date()
        }
        return this.games[index];
    }

    findAllGames(): Game[] {
        return this.games;
    }

    findOneGame(id: string): Game {
        const {game} = this.findGame(id);
        return game;
    }

    deleteGame(id: string): any {
        const {index} = this.findGame(id);
        this.games.splice(index, 1);
        return {
            deleted: true
        }
    }

    private findGame(id: string): { index: number, game: Game } {
        const index = this.games.findIndex(game => game.id === id);
        const game = this.games[index];

        if (!game) {
            throw new NotFoundException('Could not find game.');
        }

        return {index, game};
    }
}