import {Prop, Schema, SchemaFactory} from '@nestjs/mongoose';
import {DEFAULT_SCHEMA_OPTIONS} from "../../../shared/const/schema.options";
import {DefaultModel} from "../../../shared/const/default.model";
import {GameResponseObject} from "../dto/games.dto";
import {Types} from "mongoose";

@Schema(DEFAULT_SCHEMA_OPTIONS)
export class Game extends DefaultModel {
    @Prop({
        required: true
    })
    name: string;

    @Prop({
        required: true
    })
    cover: string;

    @Prop({
        required: true
    })
    screenshot: string;

    @Prop()
    searchableIndex: string;

    @Prop({
        required: true
    })
    releaseDate: Date;

    @Prop({
        required: true,
        unique: true
    })
    igdbId: string;

    @Prop({
        type: [Types.ObjectId],
        ref: "Episode"
    })
    episodes: Types.ObjectId[];

    toResponseObject: () => GameResponseObject;
}

const GameSchema = SchemaFactory.createForClass(Game);

GameSchema.pre<Game>('save', function () {
    /**
     * Setting searchableIndex to name uppercase to facilitate future searches
     */
    this.searchableIndex = this.name.toUpperCase();
});

GameSchema.methods = {
    /**
     * Mapping function that transforms a model into a correct Response Object
     */
    toResponseObject: function (): GameResponseObject {
        const {_id, name, _createdAt, _updatedAt, cover, screenshot, releaseDate, episodes, igdbId} = this;
        return {
            _id,
            _createdAt,
            _updatedAt,
            name,
            cover,
            screenshot,
            releaseDate,
            igdbId,
            episodes
        }
    }
};

export {GameSchema};