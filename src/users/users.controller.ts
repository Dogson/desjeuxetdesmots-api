import {Body, Controller, Get, Param, Post, UseGuards, UsePipes} from '@nestjs/common';
import {UsersService} from "./users.service";
import {CreateUserDto, UserResponseObject} from "./dto/users.dto";
import {ValidationPipe} from "../shared/handler/validation.pipe";
import {AuthGuard} from "../shared/handler/auth.guard";
import {User} from "./user.decorator";

@Controller()
export class UsersController {
    constructor(private readonly usersService: UsersService) {

    }

    /**
     * GET /users
     */
    @Get('users')
    async findAllUsers() {
        return this.usersService.findAll()
    }

    /**
     * GET /users/:id
     * @param id
     */
    @Get('users/:id')
    async findOneUser(@Param('id') id: string): Promise<UserResponseObject> {
        return this.usersService.findOne(id);
    }

    /**
     * POST /login
     * @param data: credentials for logging
     */
    @Post('login')
    @UsePipes(new ValidationPipe())
    async login(@Body() data: CreateUserDto): Promise<UserResponseObject> {
        return this.usersService.login(data);
    }

    /**
     * POST /register
     * @param data : credentials for registering
     */
    @Post('register')
    @UsePipes(new ValidationPipe())
    async register(@Body() data: CreateUserDto): Promise<UserResponseObject> {
        return this.usersService.register(data)
    }
}
