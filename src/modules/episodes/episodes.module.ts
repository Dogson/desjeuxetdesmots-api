import {forwardRef, Module} from "@nestjs/common";
import {MongooseModule} from "@nestjs/mongoose";
import {EpisodeSchema} from "./model/episodes.model";
import {EpisodesService} from "./episodes.service";
import {GameGenerationModule} from "../game-generation/game-generation.module";
import {EpisodesController} from "./episodes.controller";
import {GamesModule} from "../games/games.module";


@Module({
    imports: [
        MongooseModule.forFeature([{
            name: 'Episode',
            schema: EpisodeSchema
        }]),
        forwardRef(() => GamesModule),
        forwardRef(() => GameGenerationModule),
    ],
    controllers: [EpisodesController],
    providers: [EpisodesService],
    exports: [EpisodesService]
})
export class EpisodesModule {
}
