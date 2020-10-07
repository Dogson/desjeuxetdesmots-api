import {Module} from "@nestjs/common";
import {EpisodeGenerationService} from "./episode-generation.service";


@Module({
    providers: [EpisodeGenerationService],
    exports: [EpisodeGenerationService]
})
export class EpisodeGenerationModule {
}
