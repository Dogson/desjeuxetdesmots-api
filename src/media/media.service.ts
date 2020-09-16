import {HttpException, Injectable, NotFoundException} from "@nestjs/common";

import {CreateMediaDto, MediaResponseObject, UpdateMediaDto} from "./media.dto";
import {InjectModel} from "@nestjs/mongoose";

import {Media} from "./media.model";
import {isObjectId} from "../utils";
import {ERROR_TYPES} from "../shared/const/error.types";
import {Model} from "mongoose";

@Injectable()
export class MediaService  {
    constructor(
        @InjectModel('Media') private readonly mediaModel: Model<Media>
    ) {
    }

    /**
     * Create a new media
     * @param createMediaDto
     */
    async create(createMediaDto: CreateMediaDto): Promise<MediaResponseObject> {
        const newMedia = new this.mediaModel(createMediaDto);
        const result = await newMedia.save();
        return result.toResponseObject();
    }

    /**
     * Update existing media
     * @param id
     * @param updateMediaDto
     */
    async update(id: string, updateMediaDto: UpdateMediaDto): Promise<MediaResponseObject> {
        const media = await this._findAndUpdate(id, updateMediaDto);
        const result = await media.save();
        return result.toResponseObject();
    }

    /**
     * Find all media
     */
    async findAll(): Promise<MediaResponseObject[]> {
        const mediaResults: Media[] = await this.mediaModel.find().exec();
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