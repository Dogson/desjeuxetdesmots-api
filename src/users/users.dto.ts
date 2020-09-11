import {IsString, IsOptional, IsNotEmpty} from "class-validator";

export class CreateUserDto {
    @IsString()
    @IsNotEmpty()
    readonly username: string;
    @IsString()
    @IsNotEmpty()
    readonly password: string;
}

export class UpdateUserDto {
    @IsString()
    @IsOptional()
    @IsNotEmpty()
    readonly username: string;
    @IsString()
    @IsOptional()
    @IsNotEmpty()
    readonly password: string;
}

export class GetUserDto {
    readonly _id: string;
    readonly _createdAt: Date;
    readonly _updatedAt: Date;
    readonly username: string;
    token?: string;
}