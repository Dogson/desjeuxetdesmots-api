import {NestFactory} from '@nestjs/core';
import {AppModule} from './app.module';
import dotenv = require('dotenv');

async function bootstrap() {
    dotenv.config({path: "../.env"});
    const app = await NestFactory.create(AppModule, {cors: true});
    await app.listen(process.env.PORT || 3000);
}

bootstrap();