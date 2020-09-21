export interface IDefaultQuery {
    page: number;
    limit: number;
}

export const DEFAULT_QUERY_VALUES: IDefaultQuery = {
    page: 1,
    limit: 30
};

export function _parseDefaultQueryTypes(query): IDefaultQuery {
    return {
        page: parseInt(query.page),
        limit: parseInt(query.limit)
    }
}