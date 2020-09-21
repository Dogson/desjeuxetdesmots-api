import {forwardRef, Module} from "@nestjs/common";
import {MongooseModule} from "@nestjs/mongoose";

import {GamesController} from "./games.controller";
import {GamesService} from "./games.service";
import {GameSchema} from "./model/games.model";
import {EpisodesModule} from "../episodes/episodes.module";


@Module({
    imports: [
        MongooseModule.forFeature([{ name: 'Game', schema: GameSchema }]),
        forwardRef(() => EpisodesModule),
        EpisodesModule
    ],
    controllers: [GamesController],
    providers: [GamesService],
    exports: [
        MongooseModule,
        GamesService
    ]
})

export class GamesModule {
}
