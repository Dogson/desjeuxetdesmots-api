import {Module} from "@nestjs/common";
import {MongooseModule} from "@nestjs/mongoose";

import {MediaController} from "./media.controller";
import {MediaService} from "./media.service";
import {MediaSchema} from "./media.model";


@Module({
    imports: [
        MongooseModule.forFeature([{ name: 'Media', schema: MediaSchema }]),
    ],
    controllers: [MediaController],
    providers: [MediaService]
})

export class MediaModule {
}
