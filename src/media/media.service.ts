import {
    ForbiddenException,
    HttpException,
    Injectable, InternalServerErrorException,
    NotFoundException
} from "@nestjs/common";

import {CreateMediaDto, MediaResponseObject, UpdateMediaDto} from "./dto/media.dto";
import {InjectModel} from "@nestjs/mongoose";

import {Media} from "./model/media.model";
import {isObjectId} from "../shared/utils/utils";
import {ERROR_TYPES} from "../shared/const/error.types";
import {Model} from "mongoose";
import {parseRssMedia} from "./helpers/rss.parser";

@Injectable()
export class MediaService {
    constructor(
        @InjectModel('Media') private readonly mediaModel: Model<Media>
    ) {
    }

    /**
     * Create a media and generate all episodes from a RSS feed URL
     */
    async generateMediaAndEpisode(feedUrl): Promise<MediaResponseObject> {
        try {
            const generatedMedia = await parseRssMedia(feedUrl);
            const newMedia = new this.mediaModel(generatedMedia);
            const result = await newMedia.save();
            return result.toResponseObject();
        } catch (err) {
            if (err && err.code === 11000) {
                throw new ForbiddenException(ERROR_TYPES.duplicate_key(JSON.stringify(err.keyValue)));
            }
            if (err && err.error) {
                throw err;
            }
            throw new InternalServerErrorException(ERROR_TYPES.wrong_rss_format(err))
        }
    }


    /**
     * Create a new media
     * @param createMediaDto
     */
    async create(createMediaDto: CreateMediaDto): Promise<MediaResponseObject> {
        try {
            const newMedia = new this.mediaModel(createMediaDto);
            const result = await newMedia.save();
            return result.toResponseObject();
        } catch (err) {
            if (err && err.code === 11000) {
                throw new ForbiddenException(ERROR_TYPES.duplicate_key(JSON.stringify(err.keyValue)));
            } else {
                throw err;
            }
        }
    }

    /**
     * Update existing media
     * @param id
     * @param updateMediaDto
     */
    async update(id: string, updateMediaDto: UpdateMediaDto): Promise<MediaResponseObject> {
        try {
            const media = await this._findAndUpdate(id, updateMediaDto);
            const result = await media.save();
            return result.toResponseObject();
        } catch (err) {
            if (err && err.code === 11000) {
                throw new ForbiddenException(ERROR_TYPES.duplicate_key(JSON.stringify(err.keyValue)));
            } else {
                throw err;
            }
        }
    }

    /**
     * Find all media from query
     */
    async findAll(query): Promise<MediaResponseObject[]> {
        // Do not fetch episodes subdocs if param "showEpisode" is false
        const projection = query.withEpisodes ? {} : {episodes: 0};
        const mediaResults: Media[] = await this.mediaModel.find({}, projection).exec();
        return mediaResults.map(media => media.toResponseObject())
    }

    /**
     * Find media by id
     * @param id
     */
    async findOne(id: string): Promise<MediaResponseObject> {
        const media = await this._find(id);
        return media.toResponseObject();
    }

    /**
     * Delete media
     * @param id
     */
    async delete(id: string): Promise<any> {
        if (!isObjectId(id)) {
            throw new NotFoundException(ERROR_TYPES.not_found("media"));
        }
        const result = await this.mediaModel.deleteOne({_id: id}).exec();
        if (result.n === 0) {
            throw new NotFoundException(ERROR_TYPES.not_found("media"));
        }
    }

    private async _find(id: string): Promise<Media> {
        if (!isObjectId(id)) {
            throw new NotFoundException(ERROR_TYPES.not_found("media"));
        }
        let media;
        try {
            media = await this.mediaModel.findById(id).exec();
        } catch (error) {
            throw new HttpException(error.message, error.status);
        }
        if (!media) {
            throw new NotFoundException(ERROR_TYPES.not_found("media"));
        }
        return media;
    }

    private async _findAndUpdate(id: string, updateMediaDto: UpdateMediaDto): Promise<Media> {
        if (!isObjectId(id)) {
            throw new NotFoundException(ERROR_TYPES.not_found("media"));
        }
        const media = await this.mediaModel.findOneAndUpdate({_id: id}, updateMediaDto, {new: true});

        if (!media) {
            throw new NotFoundException(ERROR_TYPES.not_found("media"));
        }
        return media;
    }
}