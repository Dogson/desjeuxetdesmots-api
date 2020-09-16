import {CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor} from "@nestjs/common";
import {Observable} from "rxjs";
import {tap} from "rxjs/operators";

/**
 * Class allowing to log errors in console
 * Injected in app module
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
    intercept(
        context: ExecutionContext,
        next: CallHandler<any>
    ): Observable<any> {
        const req = context.switchToHttp().getRequest();
        const method = req.method;
        const url = req.url;
        const now = Date.now();

        return next.handle().pipe(
            tap(() =>
                Logger.log(
                    `${method} ${url} ${Date.now() - now}ms`,
                    context.getClass().name
                )
            )
        );
    }
}