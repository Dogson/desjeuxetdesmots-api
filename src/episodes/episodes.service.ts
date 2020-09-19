import {
    HttpException,
    Injectable, Logger, NotFoundException
} from "@nestjs/common";

import {InjectModel} from "@nestjs/mongoose";

import {Episode} from "./model/episodes.model";
import {Model} from "mongoose";
import {asyncForEach, isObjectId} from "../shared/utils/utils";
import {GameGenerationService} from "../game-generation/game-generation.service";
import {Media} from "../media/model/media.model";
import {ERROR_TYPES} from "../shared/const/error.types";
import {EpisodeResponseObject} from "./dto/episodes.dto";

@Injectable()
export class EpisodesService {
    private logger = new Logger('EpisodesService');

    constructor(
        @InjectModel('Episode') private readonly episodeModel: Model<Episode>,
        private readonly gameGenerationService: GameGenerationService
    ) {
    }

    /**
     * Generate all games for all episodes of a media, and reference the games in the episode and the other way around
     * @param media
     */
    async generateGamesForAllEpisodes(media: Media) {
        await asyncForEach(media.episodes, async (episode) => {
            await this.gameGenerationService.fetchAndPopulateGames(media, episode)
        });
        this.logger.log("All games have been generated for this media");
    }

    /**
     * Find game by id
     * @param id
     */
    async findOne(id: string): Promise<EpisodeResponseObject> {
        const episode = await this.findById(id);
        return episode.toResponseObject();
    }


    async findById(id: string) {
        if (!isObjectId(id)) {
            throw new NotFoundException(ERROR_TYPES.not_found("episode"));
        }
        let episode;
        try {
            episode = await this.episodeModel.findById(id).exec();
        } catch (error) {
            throw new HttpException(error.message, error.status);
        }
        if (!episode) {
            throw new NotFoundException(ERROR_TYPES.not_found("episode"));
        }
        return episode;
    }


}