import {Module} from '@nestjs/common';
import {AppController} from './app.controller';
import {AppService} from './app.service';
import {GamesModule} from "./games/games.module";
import {GamesController} from './games/games.controller';
import {GamesService} from "./games/games.service";
import {MongooseModule} from "@nestjs/mongoose";
import {DB_CONFIG} from "./config";
import * as mongoose from "mongoose";
import {APP_FILTER, APP_INTERCEPTOR} from "@nestjs/core";
import {HttpErrorFilter} from "./shared/http-error.filter";
import {LoggingInterceptor} from "./shared/logging.interceptor";

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
        AppService,
        {
            provide: APP_FILTER,
            useClass: HttpErrorFilter
        },
        {
            provide: APP_INTERCEPTOR,
            useClass: LoggingInterceptor
        }
    ],
})
export class AppModule {
}
