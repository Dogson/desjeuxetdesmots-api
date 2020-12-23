import {Body, Controller, Delete, Get, Logger, Param, Post, Put, Query, UseGuards, UsePipes} from '@nestjs/common';
import {EpisodesService} from "./episodes.service";
import {CreateEpisodeDto, GenerateEpisodesDto, EpisodeResponseObject, UpdateEpisodeDto} from "./dto/episodes.dto";
import {ValidationPipe} from "../../shared/handler/validation.pipe";
import {IDefaultQuery} from "../../shared/const/default.query.interface";
import {DEFAULT_EPISODE_QUERY} from "./query/episodes.query";
import {AuthGuard} from "../../shared/handler/auth.guard";

@Controller()
export class EpisodesController {
    private logger = new Logger('EpisodeController');

    constructor(private readonly episodesService: EpisodesService) {
    }

    /**
     * POST /episodes/generate
     */
    @Post('episodes/generate')
    @UseGuards(new AuthGuard())
    @UsePipes(new ValidationPipe())
    async generateEpisodes(@Body() generateEpisodesDto: GenerateEpisodesDto) {
        const {config, feedUrl, type, name, logo, description, youtubeChannelId, youtubePlaylistId} = generateEpisodesDto;
        return this.episodesService.generateEpisodes(feedUrl, config, type, logo, name, description, youtubeChannelId, youtubePlaylistId);
    }

    /**
     * POST /episodes/generateGames
     */
    @Post('episodes/generateGames')
    @UseGuards(new AuthGuard())
    @UsePipes(new ValidationPipe())
    generateGames() {
        this.episodesService.generateGames();
        return true;
    }

    /**
     * POST /episodes
     * @param createEpisodeDto
     */
    @Post('episodes')
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
    @Put('episodes/:id')
    @UseGuards(new AuthGuard())
    @UsePipes(new ValidationPipe())
    async updateEpisode(@Param('id') id: string, @Body() updateEpisodeDto: UpdateEpisodeDto): Promise<EpisodeResponseObject> {
        this.logger.log(JSON.stringify(updateEpisodeDto));
        return this.episodesService.update(id, updateEpisodeDto);
    }

    /**
     * GET /episodes
     */
    @Get('episodes')
    async findAllEpisode(@Query() query: IDefaultQuery): Promise<EpisodeResponseObject[]> {
        query = this._mapQueryWithDefault(query);
        return this.episodesService.findAll(query);
    }

    /**
     * Get /episodes/:id
     * @param id
     */
    @Get('episodes/:id')
    async findOneEpisode(@Param('id') id: string): Promise<EpisodeResponseObject> {
        return this.episodesService.findOne(id);
    }


    /**
     * DELETE /episodes
     * @param deleteDto
     */
    @Delete('episodes')
    @UseGuards(new AuthGuard())
    async deleteEpisodes(@Body() deleteDto: UpdateEpisodeDto): Promise<any> {
        await this.episodesService.deleteMany(deleteDto);
        return null;
    }

    /**
     * DELETE /episodes/:id
     * @param id
     */
    @Delete('episodes/:id')
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


    /**
     * GET /medias
     */
    @Get('medias')
    async findAllMedias() {
        return this.episodesService.findAllMediasBySearch();
    }

    /**
     * Get /medias/:name
     * @param name
     */
    @Get('medias/:name')
    async findOneMedia(@Param('name') name: string): Promise<any> {
        return this.episodesService.findOneMedia(name);
    }
}