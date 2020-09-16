import * as bcrypt from "bcryptjs";
import * as jwt from "jsonwebtoken";
import {Prop, Schema, SchemaFactory} from '@nestjs/mongoose';
import {DEFAULT_SCHEMA_OPTIONS} from "../../shared/const/schema.options";
import {DefaultModel} from "../../shared/const/default.model";
import {UserResponseObject} from "../dto/users.dto";
import {InternalServerErrorException} from "@nestjs/common";
import {ERROR_TYPES} from "../../shared/const/error.types";

@Schema(DEFAULT_SCHEMA_OPTIONS)
export class User extends DefaultModel {
    @Prop({
        required: true,
        unique: true
    })
    username: string;

    @Prop({
        required: true
    })
    password: string;

    toResponseObject: (showToken) => UserResponseObject;

    comparePassword: (attempt) => Promise<boolean>;

    getToken: () => string;

}

const UserSchema = SchemaFactory.createForClass(User);

UserSchema.pre<User>('save', async function () {
    /**
     * Hashing passsword before each new save
     */
    this.password = await bcrypt.hash(this.password, 10);
});

UserSchema.methods = {
    /**
     * Mapping function that transforms a model into a correct Response Object
     */
    toResponseObject: function (showToken = true): UserResponseObject {
        const {_id, _createdAt, _updatedAt, username} = this;
        const response: UserResponseObject = {
            _id,
            _createdAt,
            _updatedAt,
            username
        };
        if (showToken) {
            response.token = this.getToken();
        }
        return response;
    },
    /**
     * Checking if password is identical to hashed one
     */
    comparePassword: async function (attempt) {
        return await bcrypt.compare(attempt, this.password);
    },
    /**
     * Generate new JWT token
     */
    getToken: function () {
        try {
            const {_id, username} = this;
            return jwt.sign(
                {
                    _id,
                    username
                },
                process.env.SECRET,
                {expiresIn: '7d'})
        } catch (err) {
            throw new InternalServerErrorException(ERROR_TYPES.cannot_generate_token(err))
        }
    }
};

export {UserSchema};