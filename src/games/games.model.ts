import * as mongoose from "mongoose";
import {Prop, Schema, SchemaFactory} from '@nestjs/mongoose';
import {DEFAULT_SCHEMA_OPTIONS} from "../shared/schema.options";

@Schema(DEFAULT_SCHEMA_OPTIONS)
export class Game extends mongoose.Document {
    @Prop()
    _createdAt: Date;

    @Prop()
    _updatedAt: Date;

    @Prop({required: true})
    name: string;

    @Prop({required: true})
    cover: string;

    @Prop({required: true})
    screenshot: string;

    @Prop({required: true})
    releaseDate: Date;
}

export const GameSchema = SchemaFactory.createForClass(Game);