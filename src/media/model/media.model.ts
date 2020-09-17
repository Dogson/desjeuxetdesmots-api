import {Prop, Schema, SchemaFactory} from '@nestjs/mongoose';
import {DEFAULT_SCHEMA_OPTIONS} from "../../shared/const/schema.options";
import {DefaultModel} from "../../shared/const/default.model";
import {MediaResponseObject} from "../dto/media.dto";
import {Episode, EpisodeSchema} from "./episode.model";

@Schema(DEFAULT_SCHEMA_OPTIONS)
export class Media extends DefaultModel {
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

    @Prop({
        required: true
    })
    feedUrl: string;

    @Prop({
        type: [EpisodeSchema],
        required: false
    })
    episodes: Episode[];

    toResponseObject: () => MediaResponseObject;
}

const MediaSchema = SchemaFactory.createForClass(Media);

MediaSchema.methods = {
    /**
     * Mapping function that transforms a model into a correct Response Object
     */
    toResponseObject: function (): MediaResponseObject {
        const {_id, name, _createdAt, _updatedAt, logo, description, feedUrl, episodes} = this;
        return {
            _id,
            _createdAt,
            _updatedAt,
            name,
            logo,
            description,
            feedUrl,
            episodes
        }
    }
};

export {MediaSchema};