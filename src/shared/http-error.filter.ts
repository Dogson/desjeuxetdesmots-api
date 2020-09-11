import {ArgumentsHost, Catch, ExceptionFilter, HttpException, Logger} from "@nestjs/common";


@Catch()
export class HttpErrorFilter implements ExceptionFilter {
    catch(exception: HttpException, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const request = ctx.getRequest()
        const response = ctx.getResponse();
        const status = exception.getStatus();

        const errorResponse = {
            code: status,
            timeStamp: new Date().toISOString(),
            path: request.url,
            method: request.method,
            error: exception && exception.getResponse() && exception.getResponse()["error"],
            message: exception && exception.getResponse() && exception.getResponse()["message"]
        }

        Logger.error(`${request.method} ${request.url}`, JSON.stringify(errorResponse), 'ExceptionFilter');

        response.status(status).json(errorResponse);
    }
}