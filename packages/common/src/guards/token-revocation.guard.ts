import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';

export interface TokenRevocationValidator {
  /**
   * Check if a token issued at `tokenIssuedAt` for user `userId` has been revoked.
   * @returns true if valid, false if revoked
   */
  isTokenValid(userId: number, tokenIssuedAt: Date): Promise<boolean>;
}

/**
 * Guard that validates if an access token has been revoked by checking
 * if it was issued before the user's last logout timestamp.
 * 
 * This guard should run AFTER JWT authentication (so req.user exists).
 * It requires a TokenRevocationValidator service to be provided in the module.
 */
@Injectable()
export class TokenRevocationGuard implements CanActivate {
  constructor(
    @Inject('TokenRevocationValidator')
    private readonly validator: TokenRevocationValidator,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user as { sub?: number; iat?: number } | undefined;

    if (!user?.sub || !user?.iat) {
      // No user or no iat in token - let it pass, JWT guard will handle it
      return true;
    }

    const tokenIssuedAt = new Date(user.iat * 1000); // JWT iat is in seconds
    const isValid = await this.validator.isTokenValid(user.sub, tokenIssuedAt);

    if (!isValid) {
      throw new UnauthorizedException('Token has been revoked');
    }

    return true;
  }
}
