import {NestFactory} from '@nestjs/core';
import {AppModule} from './app.module';
import dotenv = require('dotenv');
import {HttpErrorFilter} from "./shared/handler/http-error.filter";

async function bootstrap() {
    dotenv.config({path: "../.env"});
    const app = await NestFactory.create(AppModule, {cors: true});
    app.useGlobalFilters(new HttpErrorFilter());
    const server = await app.listen(process.env.PORT || 3000);
    server.setTimeout(3600000);
}

bootstrap();