import {forwardRef, Inject, Injectable, Logger} from "@nestjs/common";
import {Cron, CronExpression} from "@nestjs/schedule";
import {EpisodesService} from "../modules/episodes/episodes.service";
import {asyncForEach} from "../shared/utils/utils";
import {MailerService} from "@nestjs-modules/mailer";

@Injectable()
export class TasksService {
    private logger = new Logger("TasksService");

    constructor(
        @Inject(forwardRef(() => EpisodesService)) private readonly episodesService: EpisodesService,
        private readonly mailerService: MailerService
    ) {
    }

    @Cron(CronExpression.EVERY_DAY_AT_3PM)
    async cronGenerateEpisodes() {
        const medias = await this.episodesService.findAllMedias();
        const generatedEpisodes = [];
        await asyncForEach(medias, async (media) => {
            const {feedUrl, config, name} = media;
            const episodes = await this.episodesService.generateEpisodes(feedUrl, config, name);
            episodes.forEach((episode) => {
                generatedEpisodes.push(episode);
            });
        });
        this.logger.log(`${generatedEpisodes.length} episodes générés`);

        if (generatedEpisodes.length > 0) {
            await this
                .mailerService
                .sendMail({
                    to: process.env.ADMIN_RECIPIENT,
                    subject: `🥃 Gamer JUICE 🎮 - ${generatedEpisodes.length} episode(s) ont été généré(s) - En attente de vérification `,
                    template: 'newEpisodes',
                    context: {
                        nbEpisodes: generatedEpisodes.length
                    },
                });

            this.logger.log(`Mail sent`);
        }
    }
}