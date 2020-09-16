import {ArgumentsHost, Catch, ExceptionFilter, HttpException, Logger} from "@nestjs/common";

/**
 * Class generating sexier HTTP errors
 * Injected in app modules dependencies
 */
@Catch()
export class HttpErrorFilter implements ExceptionFilter {
    catch(exception: HttpException, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const request = ctx.getRequest()
        const response = ctx.getResponse();
        const status = exception.getStatus && exception.getStatus();

        const errorResponse = {
            code: status,
            timeStamp: new Date().toISOString(),
            path: request.url,
            method: request.method,
            error: exception.getResponse && exception.getResponse() && exception.getResponse()["error"],
            message: exception.getResponse && exception.getResponse() && exception.getResponse()["message"]
        }

        Logger.error(`${request.method} ${request.url}`, JSON.stringify(errorResponse), 'ExceptionFilter');

        response.status(status).json(errorResponse);
    }
}