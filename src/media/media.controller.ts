import {Body, Controller, Delete, Get, Logger, Param, Post, Put, Query, UsePipes} from '@nestjs/common';
import {MediaService} from "./media.service";
import {CreateMediaDto, GenerateMediaDto, MediaResponseObject, UpdateMediaDto} from "./dto/media.dto";
import {ValidationPipe} from "../shared/handler/validation.pipe";
import {DEFAULT_MEDIA_QUERY, MediaQuery} from "./query/media.query";

@Controller('media')
export class MediaController {
    private logger = new Logger('MediaController');

    constructor(private readonly mediaService: MediaService) {

    }

    /**
     * POST /generateMedia
     */
    @Post('generate')
    @UsePipes(new ValidationPipe())
    async generateMedia(@Body() generateMediaDto: GenerateMediaDto): Promise<MediaResponseObject> {
        const {config, feedUrl} = generateMediaDto;
        return this.mediaService.generateMediaAndEpisode(feedUrl, config);
    }

    /**
     * POST /media
     * @param createMediaDto : request body
     */
    @Post()
    @UsePipes(new ValidationPipe())
    async addMedia(@Body() createMediaDto: CreateMediaDto): Promise<MediaResponseObject> {
        this.logger.log(JSON.stringify(createMediaDto));
        return this.mediaService.create(createMediaDto);
    }

    /**
     * PUT /media/:id
     * @param id
     * @param updateMediaDto : request body ; fields to update
     */
    @Put(':id')
    @UsePipes(new ValidationPipe())
    async updateMedia(@Param('id') id: string, @Body() updateMediaDto: UpdateMediaDto): Promise<MediaResponseObject> {
        this.logger.log(JSON.stringify(updateMediaDto));
        return this.mediaService.update(id, updateMediaDto);
    }

    /**
     * GET /media
     */
    @Get()
    async findAllMedia(@Query() query: MediaQuery): Promise<MediaResponseObject[]> {
        query = this._mapQueryWithDefault(query);
        return this.mediaService.findAll(query);
    }

    /**
     * Get /media/:id
     * @param id
     */
    @Get(':id')
    async findOneMedia(@Param('id') id: string): Promise<MediaResponseObject> {
        return this.mediaService.findOne(id);
    }

    /**
     * DELETE /media/:id
     * @param id
     */
    @Delete(':id')
    async deleteMedia(@Param('id') id: string): Promise<any> {
        await this.mediaService.delete(id);
        return null;
    }

    private _mapQueryWithDefault(query) {
       return {
           ...DEFAULT_MEDIA_QUERY,
           ...query
       }
    }
}