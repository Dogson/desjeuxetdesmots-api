import {forwardRef, Inject, Injectable, Logger} from "@nestjs/common";
import {Cron, CronExpression} from "@nestjs/schedule";
import {EpisodesService} from "../episodes/episodes.service";
import {asyncForEach} from "../shared/utils/utils";

@Injectable()
export class TasksService {
    private logger = new Logger("TasksService");
    private isCroning = false;

    constructor(
        @Inject(forwardRef(() => EpisodesService)) private readonly episodesService: EpisodesService
    ) {
    }

    @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT)
    async handleCron() {
        if (this.isCroning) {
            return;
        }
        this.isCroning = true;
        const medias = await this.episodesService.findAllMedias();
        const generatedEpisodes = [];
        await asyncForEach(medias, async (media) => {
            const {feedUrl, config} = media;
            const episodes = await this.episodesService.generateEpisodes(feedUrl, config);
            episodes.forEach((episode) => {
                generatedEpisodes.push(episode);
            });
        });
        this.logger.log(`${generatedEpisodes.length} episodes générés : `);
        generatedEpisodes.forEach((episode, index) => {
            this.logger.log(`${index}. ${episode.name} - ${episode.games.length} games generated.`);
        });
        this.isCroning = false;
    }
}