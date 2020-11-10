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

    @Cron(CronExpression.EVERY_4_HOURS)
    async cronGenerateEpisodes() {
        this._generateEpisodesAndGames();
        return {beginGeneration: true};
    }

    async _generateEpisodesAndGames() {
        const medias = await this.episodesService.findAllMedias();
        const generatedEpisodes = [];
        await asyncForEach(medias, async (media) => {
            this.logger.log(`Generating ${media.name}`)
            const {feedUrl, config, type, name, logo, description} = media;
            const episodes = await this.episodesService.generateEpisodes(feedUrl, config, type, logo, name, description);
            episodes.forEach((episode) => {
                generatedEpisodes.push(episode);
            });
        });

        generatedEpisodes.length > 0 && this.logger.log(`${generatedEpisodes.length} episodes générés`);

        if (generatedEpisodes.length > 0) {
            await this
                .mailerService
                .sendMail({
                    to: process.env.ADMIN_RECIPIENT,
                    subject: `🎮 Des jeux et des mots 💬 - ${generatedEpisodes.length} episode(s) ont été généré(s) - En attente de vérification `,
                    template: 'newEpisodes',
                    context: {
                        nbEpisodes: generatedEpisodes.length
                    },
                });

            this.logger.log(`Mail sent`);
        }
    }
}