import {IsBoolean, IsOptional} from "class-validator";

export class MediaQuery {
    @IsBoolean()
    @IsOptional()
    withEpisodes: boolean;
}

export const DEFAULT_MEDIA_QUERY: MediaQuery = {
    withEpisodes: false
};