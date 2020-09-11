import {Body, Controller, Get, Param, Post, UsePipes} from '@nestjs/common';
import {UsersService} from "./users.service";
import {CreateUserDto, GetUserDto} from "./users.dto";
import {ValidationPipe} from "../shared/handler/validation.pipe";

@Controller()
export class UsersController {
    constructor(private readonly usersService: UsersService) {

    }

    @Get('users')
    findAllUsers() {
        return this.usersService.findAll()
    }

    @Get('users/:id')
    findOneUser(@Param('id') id: string): Promise<GetUserDto> {
        return this.usersService.findOne(id);
    }


    @Post('login')
    @UsePipes(new ValidationPipe())
    login(@Body() data: CreateUserDto): Promise<GetUserDto> {
        return this.usersService.login(data);
    }

    @Post('register')
    @UsePipes(new ValidationPipe())
    register(@Body() data: CreateUserDto): Promise<GetUserDto> {
        return this.usersService.register(data)
    }
}
