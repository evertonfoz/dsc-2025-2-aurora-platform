import { RefreshToken } from '../../src/auth/entities/refresh-token.entity';

let seq = 1;

export function makeRefreshTokenEntity(
  overrides?: Partial<RefreshToken>,
): Partial<RefreshToken> {
  const now = new Date();
  const base: Partial<RefreshToken> = {
    id: seq++,
    userId: 1,
    tokenHash: 'hashed-token',
    issuedAt: now,
    expiresAt: new Date(now.getTime() + 1000 * 60 * 60 * 24),
    revokedAt: null,
    replacedByTokenId: null,
    ip: null,
    userAgent: null,
  };
  return { ...base, ...(overrides ?? {}) };
}
