import {Controller, Get, Query, UseGuards, UsePipes} from '@nestjs/common';
import {IgdbService} from "./igdb.service";
import {AuthGuard} from "../../shared/handler/auth.guard";
import {ValidationPipe} from "../../shared/handler/validation.pipe";

@Controller('igdb')
export class IgdbController {
    constructor(private readonly igdbService: IgdbService) {
    }

    /**
     * GET /igdb
     */
    @Get()
    @UseGuards(new AuthGuard())
    @UsePipes(new ValidationPipe())
    async findAllGames(@Query() query): Promise<any> {
        const {search, limit = 15, noFilter = false} = query;
        return this.igdbService.executeIgdbQuery(search, noFilter, limit, null);
    }
}

