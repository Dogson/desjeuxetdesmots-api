import {Module} from "@nestjs/common";
import {MongooseModule} from "@nestjs/mongoose";
import {EpisodeSchema} from "./model/episodes.model";
import {EpisodesService} from "./episodes.service";
import {GamesModule} from "../games/games.module";
import {MediaSchema} from "../media/model/media.model";
import {GameGenerationModule} from "../game-generation/game-generation.module";
import {GameGenerationService} from "../game-generation/game-generation.service";


@Module({
    imports: [
        MongooseModule.forFeatureAsync([
            {
                name: 'Episode',
                imports: [GameGenerationModule],
                useFactory: function(gameGenerationService: GameGenerationService){
                    EpisodeSchema.post('save', function() {
                        gameGenerationService.fetchAndPopulateGames(this);
                    });
                    return MediaSchema;
                },
                inject: [GameGenerationService]
            },
        ]),
        GamesModule
    ],
    providers: [EpisodesService],
    exports: [EpisodesService]
})
export class EpisodesModule {
}
