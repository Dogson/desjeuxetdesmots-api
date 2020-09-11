import * as bcrypt from "bcryptjs";
import * as jwt from "jsonwebtoken";
import {Prop, Schema, SchemaFactory} from '@nestjs/mongoose';
import {DEFAULT_SCHEMA_OPTIONS} from "../shared/const/schema.options";
import {DefaultModel} from "../shared/const/default.model";
import {GetUserDto} from "./users.dto";

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

    toResponseObject: (showToken) => GetUserDto;

    comparePassword: (attempt) => Promise<boolean>

    getToken: () => string

}

const UserSchema = SchemaFactory.createForClass(User);

UserSchema.pre<User>('save', async function () {
    this.password = await bcrypt.hash(this.password, 10);
});

UserSchema.methods = {
    toResponseObject: function (showToken = true) {
        const {_id, _createdAt, _updatedAt, username} = this;
        const response: GetUserDto = {
            _id,
            _createdAt,
            _updatedAt,
            username
        }
        if (showToken) {
            response.token = this.getToken();
        }
        return response;
    },
    comparePassword: async function (attempt) {
        return await bcrypt.compare(attempt, this.password);
    },
    getToken: function () {
        const {_id, username} = this;
        return jwt.sign(
            {
                _id,
                username
            },
            process.env.SECRET,
            {expiresIn: '7d'})
    }
}

export {UserSchema};