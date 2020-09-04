import {Module} from "@nestjs/common";
import {MongooseModule} from "@nestjs/mongoose";

import {GamesController} from "./games.controller";
import {GamesService} from "./games.service";
import {GameSchema} from "./games.model";


@Module({
    imports: [
        MongooseModule.forFeature([{ name: 'Game', schema: GameSchema }]),
    ],
    controllers: [GamesController],
    providers: [GamesService]
})

export class GamesModule {
}
