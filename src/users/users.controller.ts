import {Body, Controller, Get, Param, Post, UseGuards, UsePipes} from '@nestjs/common';
import {UsersService} from "./users.service";
import {CreateUserDto, UserResponseObject} from "./users.dto";
import {ValidationPipe} from "../shared/handler/validation.pipe";
import {AuthGuard} from "../shared/handler/auth.guard";

@Controller()
export class UsersController {
    constructor(private readonly usersService: UsersService) {

    }

    /**
     * GET /users
     */
    @Get('users')
    @UseGuards(new AuthGuard())
    findAllUsers() {
        return this.usersService.findAll()
    }

    /**
     * GET /users/:id
     * @param id
     */
    @Get('users/:id')
    findOneUser(@Param('id') id: string): Promise<UserResponseObject> {
        return this.usersService.findOne(id);
    }

    /**
     * POST /login
     * @param data: credentials for logging
     */
    @Post('login')
    @UsePipes(new ValidationPipe())
    login(@Body() data: CreateUserDto): Promise<UserResponseObject> {
        return this.usersService.login(data);
    }

    /**
     * POST /register
     * @param data : credentials for registering
     */
    @Post('register')
    @UsePipes(new ValidationPipe())
    register(@Body() data: CreateUserDto): Promise<UserResponseObject> {
        return this.usersService.register(data)
    }
}
