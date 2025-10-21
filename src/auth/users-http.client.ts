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
    // Ajuste para seu Users Service real (endpoint/rota)
    try {
      const res = await axios.post(`${this.baseUrl}/users/validate`, {
        email,
        password,
      });
      // Accept both plain UsersIdentity or wrapped { data: UsersIdentity }
      const payload = (res.data && (res.data.data ?? res.data)) as any;
      return payload?.id ? payload : null;
    } catch {
      return null;
    }
  }

  async getById(userId: number): Promise<UsersIdentity | null> {
    try {
      const res = await axios.get(`${this.baseUrl}/users/${userId}`);
      const payload = (res.data && (res.data.data ?? res.data)) as any;
      return payload?.id ? payload : null;
    } catch {
      return null;
    }
  }
}
