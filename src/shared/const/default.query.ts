import {IsNumber} from "class-validator";

export class DefaultQuery {
    @IsNumber()
    page: number;
    @IsNumber()
    limit: number;
}

export const DEFAULT_QUERY_VALUES: DefaultQuery = {
    page: 1,
    limit: 30
};

export function _parseDefaultQueryTypes(query): DefaultQuery {
    return {
        page: parseInt(query.page),
        limit: parseInt(query.limit)
    }
}