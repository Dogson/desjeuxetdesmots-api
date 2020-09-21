import {DEFAULT_QUERY_VALUES, IDefaultQuery} from "../../shared/const/default.query.interface";

export interface IMediaQuery extends IDefaultQuery {
    withEpisodes?: boolean;
}

export const DEFAULT_MEDIA_QUERY: IMediaQuery = {
    ...DEFAULT_QUERY_VALUES,
    withEpisodes: false
};