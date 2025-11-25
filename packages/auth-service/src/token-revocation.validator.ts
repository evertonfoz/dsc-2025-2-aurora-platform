import { Injectable } from '@nestjs/common';
import { TokenRevocationValidator } from '@aurora/common';
import { UsersHttpClient } from './users-http.client';

/**
 * Validates if an access token has been revoked by checking
 * if it was issued before the user's last logout timestamp.
 */
@Injectable()
export class AuthTokenRevocationValidator implements TokenRevocationValidator {
  constructor(private readonly users: UsersHttpClient) {}

  async isTokenValid(userId: number, tokenIssuedAt: Date): Promise<boolean> {
    try {
      const user = await this.users.getById(userId);
      if (!user) {
        // User not found - consider token invalid
        return false;
      }

      // If user has never logged out, token is valid
      if (!user.lastLogoutAt) {
        return true;
      }

      const lastLogout = new Date(user.lastLogoutAt);
      
      // Token is valid if it was issued AT LEAST 1 second after the last logout
      // This prevents race conditions where a new login happens immediately after logout
      const tokenIssuedAtSeconds = Math.floor(tokenIssuedAt.getTime() / 1000);
      const lastLogoutSeconds = Math.floor(lastLogout.getTime() / 1000);
      
      // Accept tokens issued 1+ seconds after logout (not in the same second)
      return tokenIssuedAtSeconds >= lastLogoutSeconds + 1;
    } catch (err) {
      // On error, fail open (allow the token) to prevent service disruption
      // The JWT itself is still valid and signed correctly
      console.error('Error validating token revocation:', err);
      return true;
    }
  }
}
