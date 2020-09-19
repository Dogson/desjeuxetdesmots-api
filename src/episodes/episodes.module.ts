import {Module} from "@nestjs/common";
import {MongooseModule} from "@nestjs/mongoose";
import {EpisodeSchema} from "./model/episodes.model";
import {EpisodesService} from "./episodes.service";
import {GameGenerationModule} from "../game-generation/game-generation.module";


@Module({
    imports: [
        MongooseModule.forFeature([{
            name: 'Episode',
            schema: EpisodeSchema
        }]),
        GameGenerationModule
    ],
    providers: [EpisodesService],
    exports: [EpisodesService]
})
export class EpisodesModule {
}
