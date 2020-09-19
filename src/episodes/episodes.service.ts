import {
    Injectable, Logger
} from "@nestjs/common";

import {InjectModel} from "@nestjs/mongoose";

import {Episode} from "./model/episodes.model";
import {Model} from "mongoose";
import {asyncForEach} from "../shared/utils/utils";
import {GameGenerationService} from "../game-generation/game-generation.service";
import {Media} from "../media/model/media.model";

@Injectable()
export class EpisodesService {
    private logger = new Logger('EpisodesService');

    constructor(
        @InjectModel('Episode') private readonly episodeModel: Model<Episode>,
        private readonly gameGenerationService: GameGenerationService
    ) {
    }

    async generateGamesForAllEpisodes(media: Media) {
        await asyncForEach(media.episodes, async (episode) => {
            await this.gameGenerationService.fetchAndPopulateGames(media, episode)
        });
        this.logger.log("All games have been generated for this media");
    }

}