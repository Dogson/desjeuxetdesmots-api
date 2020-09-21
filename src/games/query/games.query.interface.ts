import {DEFAULT_QUERY_VALUES, IDefaultQuery} from "../../shared/const/default.query.interface";

export interface IGameQuery extends IDefaultQuery {
    name?: string
}

export const DEFAULT_GAME_QUERY: IGameQuery = {
    ...DEFAULT_QUERY_VALUES
};