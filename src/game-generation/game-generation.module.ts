import {forwardRef, Module} from "@nestjs/common";
import {GameGenerationService} from "./game-generation.service";
import {GamesModule} from "../games/games.module";
import {IgdbModule} from "../igdb/igdb.module";


@Module({
    imports: [
        forwardRef(() => GamesModule),
        forwardRef(() => IgdbModule)
    ],
    providers: [GameGenerationService],
    exports: [GameGenerationService]
})
export class GameGenerationModule {
}
