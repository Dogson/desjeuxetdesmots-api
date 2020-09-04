import * as mongoose from "mongoose";
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema()
export class Game extends mongoose.Document {
    @Prop({required: true})
    lastUpdated: Date;

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