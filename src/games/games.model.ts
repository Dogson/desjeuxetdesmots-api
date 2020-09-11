import {Prop, Schema, SchemaFactory} from '@nestjs/mongoose';
import {DEFAULT_SCHEMA_OPTIONS} from "../shared/const/schema.options";
import {DefaultModel} from "../shared/const/default.model";
import {GetGameDto} from "./games.dto";

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

    @Prop({
        required: true
    })
    releaseDate: Date;

    toResponseObject: () => GetGameDto;
}

const GameSchema = SchemaFactory.createForClass(Game);

GameSchema.methods = {
    toResponseObject: function() {
        const {_id, name, _createdAt, _updatedAt, cover, screenshot, releaseDate} = this;
        return {
            _id,
            _createdAt,
            _updatedAt,
            name,
            cover,
            screenshot,
            releaseDate
        }
    }
}

export {GameSchema};