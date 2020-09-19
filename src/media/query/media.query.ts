import {IsBoolean, IsOptional} from "class-validator";
import {DEFAULT_QUERY_VALUES, DefaultQuery} from "../../shared/const/default.query";

export class MediaQuery extends DefaultQuery {
    @IsBoolean()
    @IsOptional()
    withEpisodes: boolean;
}

export const DEFAULT_MEDIA_QUERY: MediaQuery = {
    ...DEFAULT_QUERY_VALUES,
    withEpisodes: false
};