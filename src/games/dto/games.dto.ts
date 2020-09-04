export class CreateGameDto {
    readonly name: string;
    readonly cover: string;
    readonly screenshot: string;
    readonly releaseDate: Date;
}

export class GetGameDto {
    readonly id: string;
    readonly lastUpdated: Date;
    readonly name: string;
    readonly cover: string;
    readonly screenshot: string;
    readonly releaseDate: Date;
}