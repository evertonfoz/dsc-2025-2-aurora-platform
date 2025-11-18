import { Injectable } from '@nestjs/common';
import axios from 'axios';

export interface UsersIdentity {
  id: number;
  email: string;
  name?: string;
  roles?: string[];
}

@Injectable()
export class UsersHttpClient {
  private baseUrl = process.env.USERS_API_URL ?? 'http://users:3000';

  async validateUser(
    email: string,
    password: string,
  ): Promise<UsersIdentity | null> {
    try {
      const res = await axios.post<UsersIdentity | { data: UsersIdentity }>(
        `${this.baseUrl}/users/validate`,
        {
          email,
          password,
        },
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
      const res = await axios.get<UsersIdentity | { data: UsersIdentity }>(
        `${this.baseUrl}/users/${userId}`,
      );
      const data = res.data as UsersIdentity | { data: UsersIdentity };
      const payload: UsersIdentity | undefined = 'data' in data ? data.data : data;
      return payload?.id ? payload : null;
    } catch {
      return null;
    }
  }
}
