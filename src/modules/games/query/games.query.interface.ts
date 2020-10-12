import {DEFAULT_QUERY_VALUES, IDefaultQuery} from "../../../shared/const/default.query.interface";

export interface IGameQuery extends IDefaultQuery {
    name?: string,
    episodes?: any,
    igdbId?: string,
    filters?: string | {
        type?: string[],
        media?: string[]
    }
}

export const DEFAULT_GAME_QUERY: IGameQuery = {
    ...DEFAULT_QUERY_VALUES,
    episodes: {$type: 'array', $ne: []},
    filters: '{}'
};

export const GAME_SEARCHABLE_INDEX = "name";