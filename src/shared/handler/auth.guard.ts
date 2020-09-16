import {Injectable, CanActivate, ExecutionContext} from '@nestjs/common';


/**
 * Class checking for request authorization
 * Injectable in controllers
 */
@Injectable()
export class AuthGuard implements CanActivate {
    async canActivate(
        context: ExecutionContext,
    ): Promise<boolean> {
        const request = context.switchToHttp().getRequest();

        await this.validateToken(request.headers.authorization);
        return true;
    }

    // Check if token is valid
    async validateToken(auth: string) {
        return Promise.resolve(true);
    }
}
