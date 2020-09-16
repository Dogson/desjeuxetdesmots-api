import * as mongoose from "mongoose";
import {Prop} from '@nestjs/mongoose';

/**
 * Default model to be extended by all other models
 * Contains common attributes
 */
export class DefaultModel extends mongoose.Document {
    @Prop()
    _createdAt: Date;

    @Prop()
    _updatedAt: Date;
}