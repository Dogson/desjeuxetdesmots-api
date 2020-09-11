import * as mongoose from "mongoose";
import {Prop} from '@nestjs/mongoose';

export class DefaultModel extends mongoose.Document {
    @Prop()
    _createdAt: Date;

    @Prop()
    _updatedAt: Date;
}