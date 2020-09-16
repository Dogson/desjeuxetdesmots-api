import {Injectable, CanActivate, ExecutionContext, ForbiddenException} from '@nestjs/common';
import {ERROR_TYPES} from "../const/error.types";
import * as jwt from "jsonwebtoken";


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
        if (!request.headers.authorization) {
            return false;
        }
        request.user = await this.validateToken(request.headers.authorization);
        return true;
    }

    /**
     * Check if a Bearer authorization header is valid
     * @param auth
     */
    async validateToken(auth: string) {
        if (auth.split(' ')[0] !== 'Bearer') {
            throw new ForbiddenException(ERROR_TYPES.invalid_auth);
        }
        const token = auth.split(' ')[1];
        try {
            return jwt.verify(token, process.env.SECRET);
        } catch (err) {
            throw new ForbiddenException(ERROR_TYPES.token_error(err.message || err.name));
        }
    }
}
