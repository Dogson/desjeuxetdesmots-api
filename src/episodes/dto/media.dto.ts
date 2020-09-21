import {IsString, IsOptional, IsUrl} from "class-validator";

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
}

/**
 * Response object format sent by the API
 */
export class MediaResponseObject {
    readonly name: string;
    readonly logo: string;
    readonly description: string;
}