import {
    Injectable, Logger
} from "@nestjs/common";

import {InjectModel} from "@nestjs/mongoose";

import {Episode} from "./model/episodes.model";
import {Model} from "mongoose";

@Injectable()
export class EpisodesService {
    private logger = new Logger('EpisodesService');

    constructor(
        @InjectModel('Episode') private readonly episodeModel: Model<Episode>
    ) {
    }


}