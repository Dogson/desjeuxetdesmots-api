import * as mongoose from "mongoose";

export const GameSchema = new mongoose.Schema({
    lastUpdated: {type: Date, required: true},
    name: {type: String, required: true},
    cover: {type: String, required: true},
    screenshot: {type: String, required: true},
    releaseDate: {type: Date, required: true},
});

export interface Game extends mongoose.Document {
    id: string;
    lastUpdated: Date;
    name: string;
    cover: string;
    screenshot: string;
    releaseDate: Date;
}