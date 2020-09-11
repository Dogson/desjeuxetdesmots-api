import {IsString, IsDateString} from "class-validator";

export class CreateGameDto {
    @IsString()
    readonly name: string;
    @IsString()
    readonly cover: string;
    @IsString()
    readonly screenshot: string;
    @IsDateString()
    readonly releaseDate: Date;
}

export class GetGameDto {
    readonly _id: string;
    readonly lastUpdated: Date;
    readonly name: string;
    readonly cover: string;
    readonly screenshot: string;
    readonly releaseDate: Date;
}