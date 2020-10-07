import {Body, Controller, Delete, Get, Logger, Param, Post, Put, Query, UseGuards, UsePipes} from '@nestjs/common';
import {EpisodesService} from "./episodes.service";
import {CreateEpisodeDto, GenerateEpisodesDto, EpisodeResponseObject, UpdateEpisodeDto} from "./dto/episodes.dto";
import {ValidationPipe} from "../../shared/handler/validation.pipe";
import {IDefaultQuery} from "../../shared/const/default.query.interface";
import {DEFAULT_EPISODE_QUERY} from "./query/episodes.query";
import {AuthGuard} from "../../shared/handler/auth.guard";

@Controller('episodes')
export class EpisodesController {
    private logger = new Logger('EpisodeController');

    constructor(private readonly episodesService: EpisodesService) {
    }

    /**
     * POST /episodes/generate
     */
    @Post('generate')
    @UseGuards(new AuthGuard())
    @UsePipes(new ValidationPipe())
    async generateEpisodes(@Body() generateEpisodesDto: GenerateEpisodesDto) {
        const {config, feedUrl, type, name, youtubeId} = generateEpisodesDto;
        return this.episodesService.generateEpisodes(feedUrl, config, type, name, youtubeId);
    }

    /**
     * POST /episodes
     * @param createEpisodeDto
     */
    @Post()
    @UseGuards(new AuthGuard())
    @UsePipes(new ValidationPipe())
    async createEpisode(@Body() createEpisodeDto: CreateEpisodeDto): Promise<EpisodeResponseObject> {
        this.logger.log(JSON.stringify(createEpisodeDto));
        return this.episodesService.create(createEpisodeDto);
    }

    /**
     * PUT /episodes/:id
     * @param id
     * @param updateEpisodeDto
     */
    @Put(':id')
    @UseGuards(new AuthGuard())
    @UsePipes(new ValidationPipe())
    async updateEpisode(@Param('id') id: string, @Body() updateEpisodeDto: UpdateEpisodeDto): Promise<EpisodeResponseObject> {
        this.logger.log(JSON.stringify(updateEpisodeDto));
        return this.episodesService.update(id, updateEpisodeDto);
    }

    /**
     * GET /episodes
     */
    @Get()
    async findAllEpisode(@Query() query: IDefaultQuery): Promise<EpisodeResponseObject[]> {
        query = this._mapQueryWithDefault(query);
        return this.episodesService.findAll(query);
    }

    /**
     * Get /episodes/:id
     * @param id
     */
    @Get(':id')
    async findOneEpisode(@Param('id') id: string): Promise<EpisodeResponseObject> {
        return this.episodesService.findOne(id);
    }


    /**
     * DELETE /episodes/:id
     * @param deleteDto
     */
    @Delete()
    @UseGuards(new AuthGuard())
    async deleteEpisodes(@Body() deleteDto: UpdateEpisodeDto): Promise<any> {
        await this.episodesService.deleteMany(deleteDto);
        return null;
    }

    /**
     * DELETE /episodes/:id
     * @param id
     */
    @Delete(':id')
    @UseGuards(new AuthGuard())
    async deleteEpisode(@Param('id') id: string): Promise<any> {
        await this.episodesService.delete(id);
        return null;
    }

    private _mapQueryWithDefault(query) {
        return {
            ...DEFAULT_EPISODE_QUERY,
            ...query
        }
    }
}
