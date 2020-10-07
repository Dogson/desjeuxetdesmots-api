import {IsString, IsUrl} from "class-validator";
import {MediaConfig} from "../model/media.model";

/**
 * Request object format used in POSTing a new episode
 */
export class MediaDto {
    @IsString()
    name: string;
    @IsUrl()
    logo: string;
    @IsString()
    description: string;
    @IsString()
    type: string;
    @IsString()
    feedUrl: string;
    config: MediaConfig;
}


/**
 * Response object format sent by the API
 */
export class MediaResponseObject {
    readonly name: string;
    readonly logo: string;
    readonly description: string;
    readonly type: "podcast" | "video";
}