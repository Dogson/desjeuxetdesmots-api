import {Module} from "@nestjs/common";
import {MongooseModule} from "@nestjs/mongoose";

import {MediaController} from "./media.controller";
import {MediaService} from "./media.service";
import {MediaSchema} from "./model/media.model";
import {EpisodesModule} from "../episodes/episodes.module";


@Module({
    imports: [
        MongooseModule.forFeature([{
            name: 'Media',
            schema: MediaSchema
        }]),
        EpisodesModule
    ],
    controllers: [MediaController],
    providers: [MediaService],
    exports: [MediaService]
})

export class MediaModule {
}
