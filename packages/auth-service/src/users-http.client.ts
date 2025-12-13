import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import jwt from 'jsonwebtoken';

export interface UsersIdentity {
  id: number;
  email: string;
  name?: string;
  roles?: string[];
  lastLogoutAt?: string | null;
}

@Injectable()
export class UsersHttpClient {
  private readonly baseUrl: string;
  private readonly client: AxiosInstance;
  private readonly serviceToken: string;

  constructor() {
    this.baseUrl = process.env.USERS_API_URL ?? 'http://users-service:3011';
    this.serviceToken = process.env.SERVICE_TOKEN ?? '';
    if (!this.serviceToken) {
      throw new Error('SERVICE_TOKEN is required for internal user calls');
    }
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 5000,
      headers: {
        'x-service-token': this.serviceToken,
      },
    });
  }

  private async withRetry<T>(fn: () => Promise<T>): Promise<T> {
    const maxAttempts = 3;
    const baseDelayMs = 200;

    let lastError: unknown;
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      try {
        return await fn();
      } catch (err) {
        lastError = err;
        if (attempt === maxAttempts - 1) {
          break;
        }
        const delay = baseDelayMs * 2 ** attempt;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
    throw lastError instanceof Error ? lastError : new Error('Unknown error on users-http client');
  }

  async validateUser(
    email: string,
    password: string,
  ): Promise<UsersIdentity | null> {
    try {
      const res = await this.withRetry(() =>
        this.client.post<UsersIdentity | { data: UsersIdentity }>(
          '/users/validate',
          {
            email,
            password,
          },
        ),
      );
      const data = res.data as UsersIdentity | { data: UsersIdentity };
      const payload: UsersIdentity | undefined = 'data' in data ? data.data : data;
      return payload?.id ? payload : null;
    } catch {
      return null;
    }
  }

  async getById(userId: number): Promise<UsersIdentity | null> {
    try {
      const res = await this.withRetry(() =>
        this.client.get<UsersIdentity | { data: UsersIdentity }>(`/users/${userId}`),
      );
      const data = res.data as UsersIdentity | { data: UsersIdentity };
      const payload: UsersIdentity | undefined = 'data' in data ? data.data : data;
      return payload?.id ? payload : null;
    } catch {
      return null;
    }
  }

  async setLastLogoutAt(userId: number, date?: Date): Promise<boolean> {
    try {
      const res = await this.withRetry(() =>
        this.client.patch(`/users/${userId}/last-logout`, {
          lastLogoutAt: date?.toISOString() ?? new Date().toISOString(),
        }),
      );
      return res.status >= 200 && res.status < 300;
    } catch (err) {
      return false;
    }
  }
}
