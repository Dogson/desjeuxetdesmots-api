import {Module} from "@nestjs/common";
import {GameGenerationService} from "./game-generation.service";
import {GamesModule} from "../games/games.module";


@Module({
    imports: [GamesModule],
    providers: [GameGenerationService],
    exports: [GameGenerationService]
})
export class GameGenerationModule {
}
