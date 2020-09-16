import {BadRequestException, ForbiddenException, HttpException, Injectable, NotFoundException} from '@nestjs/common';
import {CreateUserDto, UserResponseObject} from "./dto/users.dto";
import {User} from "./model/users.model";
import {InjectModel} from "@nestjs/mongoose";
import {Model} from "mongoose";
import {ERROR_TYPES} from "../shared/const/error.types";

@Injectable()
export class UsersService {
    constructor(
        @InjectModel('User') private readonly userModel: Model<User>
    ) {
    }

    /**
     * Find all users
     */
    async findAll(): Promise<UserResponseObject[]> {
        const userResults: User[] = await this.userModel.find().exec();
        return userResults.map(user => user.toResponseObject(false))
    }

    /**
     * Find one user by id
     * @param id
     */
    async findOne(id: string): Promise<UserResponseObject> {
        const user = await this._findById(id);
        return user.toResponseObject(true);
    }

    /**
     * Find user by credentials
     * @param data: credentials of user
     */
    async login(data: CreateUserDto): Promise<UserResponseObject> {
        const {username, password} = data;
        const user = await this.userModel.findOne({username}).exec();
        if (!user || !(await user.comparePassword(password))) {
            throw new ForbiddenException(ERROR_TYPES.invalid_credentials);
        }

        return user.toResponseObject(true);
    }

    /**
     * Create new user
     * @param data : credentials of uer
     */
    async register(data: CreateUserDto): Promise<UserResponseObject> {
        const {username} = data;
        const user = await this.userModel.findOne({username}).exec();
        if (user) {
            throw new BadRequestException(ERROR_TYPES.user_already_exists);
        }
        const newUser = new this.userModel(data);
        const result = await newUser.save();
        return result.toResponseObject(true);
    }

    /**
     * Find user by id
     * @param id
     * @private
     */
    private async _findById(id: string): Promise<User> {
        return this._findWhere({_id: id});
    }

    /**
     * Find user by any condition
     * @param condition
     * @private
     */
    private async _findWhere(condition: any): Promise<User> {
        let user;
        try {
            user = await this.userModel.findOne(condition).exec();
        } catch (error) {
            throw new HttpException(error.message, error.status);
        }
        if (!user) {
            throw new NotFoundException(ERROR_TYPES.not_found("user"));
        }
        return user;
    }
}
