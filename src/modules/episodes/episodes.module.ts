import {forwardRef, Module} from "@nestjs/common";
import {MongooseModule} from "@nestjs/mongoose";
import {EpisodeSchema} from "./model/episodes.model";
import {EpisodesService} from "./episodes.service";
import {GameGenerationModule} from "../game-generation/game-generation.module";
import {EpisodesController} from "./episodes.controller";
import {GamesModule} from "../games/games.module";
import {EpisodeGenerationModule} from "../episode-generation/episode-generation.module";


@Module({
    imports: [
        MongooseModule.forFeature([{
            name: 'Episode',
            schema: EpisodeSchema
        }]),
        forwardRef(() => GamesModule),
        forwardRef(() => GameGenerationModule),
        EpisodeGenerationModule
    ],
    controllers: [EpisodesController],
    providers: [EpisodesService],
    exports: [EpisodesService]
})
export class EpisodesModule {
}
