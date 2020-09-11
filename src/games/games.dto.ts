import {IsString, IsDateString, IsOptional} from "class-validator";

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

export class UpdateGameDto {
    @IsString()
    @IsOptional()
    readonly name: string;
    @IsString()
    @IsOptional()
    readonly cover: string;
    @IsString()
    @IsOptional()
    readonly screenshot: string;
    @IsDateString()
    @IsOptional()
    readonly releaseDate: Date;
}

export class GetGameDto {
    readonly _id: string;
    readonly _createdAt: Date;
    readonly _updatedAt: Date;
    readonly name: string;
    readonly cover: string;
    readonly screenshot: string;
    readonly releaseDate: Date;
}