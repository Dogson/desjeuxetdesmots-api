import {Prop, Schema, SchemaFactory} from '@nestjs/mongoose';
import {DEFAULT_SCHEMA_OPTIONS} from "../../shared/const/schema.options";
import {DefaultModel} from "../../shared/const/default.model";
import {EpisodeResponseObject} from "../dto/episodes.dto";
import {Types} from "mongoose";

@Schema(DEFAULT_SCHEMA_OPTIONS)
export class Episode extends DefaultModel {
    @Prop({
        required: true
    })
    name: string;

    @Prop({
        required: true
    })
    image: string;

    @Prop({
        required: true
    })
    description: string;

    @Prop({
        required: true,
    })
    fileUrl: string;

    @Prop({
        required: true
    })
    releaseDate: Date;

    @Prop({
        type: [Types.ObjectId],
        ref: "Game"
    })
    games: Types.ObjectId[];

    @Prop({
        default: false
    })
    verified: boolean;

    @Prop({
        default: false
    })
    generatedGames: boolean;

    toResponseObject: () => EpisodeResponseObject;
}

const EpisodeSchema = SchemaFactory.createForClass(Episode);

EpisodeSchema.methods = {
    /**
     * Mapping function that transforms a model into a correct Response Object
     */
    toResponseObject: function (): EpisodeResponseObject {
        const {_id, name, _createdAt, _updatedAt, image, description, fileUrl, releaseDate, games, verified} = this;
        return {
            _id,
            _createdAt,
            _updatedAt,
            name,
            image,
            description,
            fileUrl,
            releaseDate,
            games,
            verified
        }
    }
};


export {EpisodeSchema};