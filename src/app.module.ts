import {Module} from '@nestjs/common';
import {AppController} from './app.controller';
import {AppService} from './app.service';
import {GamesModule} from "./modules/games/games.module";
import {MongooseModule} from "@nestjs/mongoose";
import * as mongoose from "mongoose";
import {APP_FILTER, APP_INTERCEPTOR} from "@nestjs/core";
import {HttpErrorFilter} from "./shared/handler/http-error.filter";
import {LoggingInterceptor} from "./shared/handler/logging.interceptor";
import { UsersModule } from './users/users.module';
import { ConfigModule } from '@nestjs/config';
import {EpisodesModule} from "./modules/episodes/episodes.module";
import { IgdbModule } from './modules/igdb/igdb.module';
import {ScheduleModule} from "@nestjs/schedule";
import {TasksModule} from "./tasks/tasks.module";
// import {MailerModule} from "@nestjs-modules/mailer";
// import {HandlebarsAdapter} from "@nestjs-modules/mailer/dist/adapters/handlebars.adapter";
import {GameGenerationModule} from "./modules/game-generation/game-generation.module";
import {EpisodeGenerationModule} from "./modules/episode-generation/episode-generation.module";

mongoose.set('useFindAndModify', false);
mongoose.set('runValidators', true);

@Module({
    imports: [
        ConfigModule.forRoot({isGlobal: true}),
        MongooseModule.forRoot(process.env.CONNECTION_STRING),
        ScheduleModule.forRoot(),
        // MailerModule.forRoot({
        //     transport: {
        //         host: process.env.SMTP_HOST,
        //         port: process.env.SMTP_PORT,
        //         secure: false, // upgrade later with STARTTLS
        //         auth: {
        //             user: process.env.SMTP_USERNAME,
        //             pass: process.env.SMTP_PASSWORD
        //         },
        //     },
        //     defaults: {
        //         from:`"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_ADDRESS}>`,
        //     },
        //     template: {
        //         dir: './templates',
        //         adapter: new HandlebarsAdapter(),
        //         options: {
        //             strict: true,
        //         },
        //     },
        // }),
        GamesModule,
        EpisodesModule,
        GameGenerationModule,
        EpisodeGenerationModule,
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
