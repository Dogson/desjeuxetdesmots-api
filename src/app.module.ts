import {Module} from '@nestjs/common';
import {AppController} from './app.controller';
import {AppService} from './app.service';
import {GamesModule} from "./games/games.module";
import {GamesController} from './games/games.controller';
import {GamesService} from "./games/games.service";
import {MongooseModule} from "@nestjs/mongoose";
import {DB_CONFIG} from "./config";
import * as mongoose from "mongoose";

mongoose.set('useFindAndModify', false);

@Module({
    imports: [
        GamesModule,
        MongooseModule.forRoot(DB_CONFIG.connectionString)
    ],
    controllers: [
        AppController
    ],
    providers: [
        AppService
    ],
})
export class AppModule {
}
