import {IsString, IsOptional, IsUrl, IsDateString, IsBoolean} from "class-validator";
import {Types} from "mongoose";
import {MediaDto, MediaResponseObject} from "./media.dto";
import {MediaConfig} from "../model/media.model";

/**
 * Request object format used in POSTing a new episode
 */
export class CreateEpisodeDto {
    @IsString()
    readonly name: string;
    @IsUrl()
    readonly image: string;
    @IsString()
    readonly description: string;
    @IsUrl()
    readonly fileUrl: string;
    @IsDateString()
    readonly releaseDate: Date;
    readonly config: MediaConfig;
}

/**
 * Request object format used in PUTing a new episode
 */
export class UpdateEpisodeDto {
    @IsString()
    @IsOptional()
    readonly name: string;
    @IsUrl()
    @IsOptional()
    readonly image: string;
    @IsString()
    @IsOptional()
    readonly description: string;
    @IsUrl()
    @IsOptional()
    readonly fileUrl: string;
    @IsDateString()
    @IsOptional()
    readonly releaseDate: Date;
    @IsBoolean()
    @IsOptional()
    readonly verified: true;
    @IsOptional()
    games: any;
}

export class GenerateEpisodesDto {
    @IsString()
    readonly feedUrl: string;
    readonly config: MediaConfig;
    readonly type: "podcast" | "video";
    readonly name?: string;
    readonly youtubeId?: string;
}

export class EpisodeDto {
    @IsString()
    readonly name: string;
    @IsUrl()
    readonly image: string;
    @IsString()
    readonly description: string;
    @IsUrl()
    readonly fileUrl: string;
    @IsDateString()
    readonly releaseDate: Date;
    readonly media: MediaDto;
}

/**
 * Response object format sent by the API
 */
export class EpisodeResponseObject {
    readonly _id: string;
    readonly _createdAt: Date;
    readonly _updatedAt: Date;
    readonly name: string;
    readonly image: string;
    readonly description: string;
    readonly fileUrl: string;
    readonly releaseDate: Date;
    readonly games: Types.ObjectId[];
    readonly verified: boolean;
    readonly media: MediaResponseObject;
}