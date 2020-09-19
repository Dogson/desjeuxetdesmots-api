import {IsString, IsOptional, IsUrl} from "class-validator";
import {CreateEpisodeDto, EpisodeResponseObject} from "../../episodes/dto/episodes.dto";
import {MediaConfig} from "../model/media.model";

/**
 * Request object format used in POSTing a new media
 */
export class CreateMediaDto {
    @IsString()
    readonly name: string;
    @IsUrl()
    readonly logo: string;
    @IsString()
    readonly description: string;
    @IsUrl()
    readonly feedUrl: string;
    @IsOptional()
    readonly episodes: CreateEpisodeDto[];
    @IsOptional()
    readonly config: MediaConfig;
}

/**
 * Request object format used in PUTing a new media
 */
export class UpdateMediaDto {
    @IsString()
    @IsOptional()
    readonly name: string;
    @IsUrl()
    @IsOptional()
    readonly logo: string;
    @IsString()
    @IsOptional()
    readonly description: string;
    @IsUrl()
    @IsOptional()
    readonly feedUrl: string;
}

/**
 * Response object format sent by the API
 */
export class MediaResponseObject {
    readonly _id: string;
    readonly _createdAt: Date;
    readonly _updatedAt: Date;
    readonly name: string;
    readonly logo: string;
    readonly description: string;
    readonly feedUrl: string;
    episodes: EpisodeResponseObject[];
}


export class GenerateMediaDto {
    @IsString()
    readonly feedUrl: string;
    readonly config: MediaConfig;
}