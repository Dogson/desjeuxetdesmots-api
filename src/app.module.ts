import {Module} from '@nestjs/common';
import {AppController} from './app.controller';
import {AppService} from './app.service';
import {GamesModule} from "./games/games.module";
import {MongooseModule} from "@nestjs/mongoose";
import * as mongoose from "mongoose";
import {APP_FILTER, APP_INTERCEPTOR} from "@nestjs/core";
import {HttpErrorFilter} from "./shared/handler/http-error.filter";
import {LoggingInterceptor} from "./shared/handler/logging.interceptor";
import { UsersModule } from './users/users.module';
import { ConfigModule } from '@nestjs/config';
import {EpisodesModule} from "./episodes/episodes.module";
import { IgdbModule } from './igdb/igdb.module';
import {ScheduleModule} from "@nestjs/schedule";
import {TasksModule} from "./tasks/tasks.module";

mongoose.set('useFindAndModify', false);
mongoose.set('runValidators', true);

@Module({
    imports: [
        ConfigModule.forRoot({isGlobal: true}),
        MongooseModule.forRoot(process.env.CONNECTION_STRING),
        ScheduleModule.forRoot(),
        GamesModule,
        EpisodesModule,
        UsersModule,
        IgdbModule,
        TasksModule
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
