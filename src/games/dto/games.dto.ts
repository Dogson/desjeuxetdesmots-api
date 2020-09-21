import {IsString, IsDateString, IsOptional, IsUrl} from "class-validator";
import {Types} from "mongoose";
import {EpisodeResponseObject} from "../../episodes/dto/episodes.dto";

/**
 * Request object format used in POSTing a new game
 */
export class CreateGameDto {
    @IsString()
    readonly name: string;
    @IsUrl()
    readonly cover: string;
    @IsUrl()
    readonly screenshot: string;
    @IsDateString()
    readonly releaseDate: Date;
    readonly episodes: Types.ObjectId[];
    @IsString()
    readonly igdbId: string;
}

/**
 * Request object format used in PUTing a new game
 */
export class UpdateGameDto {
    @IsString()
    @IsOptional()
    readonly name: string;
    @IsUrl()
    @IsOptional()
    readonly cover: string;
    @IsUrl()
    @IsOptional()
    readonly screenshot: string;
    @IsDateString()
    @IsOptional()
    readonly releaseDate: Date;
}

/**
 * Response object format sent by the API
 */
export class GameResponseObject {
    readonly _id: string;
    readonly _createdAt: Date;
    readonly _updatedAt: Date;
    readonly name: string;
    readonly cover: string;
    readonly screenshot: string;
    readonly releaseDate: Date;
    readonly episodes: Types.ObjectId[] | EpisodeResponseObject[];
    readonly igdbId: string;
}