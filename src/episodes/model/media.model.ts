import {Prop, Schema, SchemaFactory} from '@nestjs/mongoose';
import {DEFAULT_SCHEMA_OPTIONS} from "../../shared/const/schema.options";
import {MediaResponseObject} from "../dto/media.dto";
import * as mongoose from "mongoose";

export interface MediaConfig {
    excludeStrings: string[],
    excludeRegex: RegExp[],
    ignoreEpisode: string[],
    endOfParseStrings: string[],
    parseProperty: string
}

@Schema({_id: false, ...DEFAULT_SCHEMA_OPTIONS})
export class Media extends mongoose.Document {
    @Prop({
        required: true,
        unique: true
    })
    name: string;

    @Prop({
        required: true
    })
    logo: string;

    @Prop({
        required: true
    })
    description: string;

    toResponseObject: () => MediaResponseObject;
}

const MediaSchema = SchemaFactory.createForClass(Media);

MediaSchema.methods = {
    /**
     * Mapping function that transforms a model into a correct Response Object
     */
    toResponseObject: function (): MediaResponseObject {
        const {name, logo, description} = this;
        return {
            name,
            logo,
            description
        }
    }
};

export {MediaSchema};