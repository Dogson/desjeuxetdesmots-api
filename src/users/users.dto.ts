import {IsString, IsOptional, IsNotEmpty} from "class-validator";

/**
 * Request object format used in POSTing a new user
 */
export class CreateUserDto {
    @IsString()
    @IsNotEmpty()
    readonly username: string;
    @IsString()
    @IsNotEmpty()
    readonly password: string;
}

/**
 * Request object format used in PUTing a new user
 */
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

/**
 * Response object format sent by the API
 */
export class UserResponseObject {
    readonly _id: string;
    readonly _createdAt: Date;
    readonly _updatedAt: Date;
    readonly username: string;
    token?: string;
}