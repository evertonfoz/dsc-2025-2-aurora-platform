import { Injectable } from '@nestjs/common';
import axios from 'axios';

export type UsersIdentity = { id: number; email: string; name?: string; roles?: string[] };

@Injectable()
export class UsersHttpClient {
  private baseUrl = process.env.USERS_API_URL || 'http://users:3000';

  async validateUser(email: string, password: string): Promise<UsersIdentity | null> {
    // Ajuste para seu Users Service real (endpoint/rota)
    try {
      const { data } = await axios.post(`${this.baseUrl}/users/validate`, { email, password });
      return data?.id ? data : null;
    } catch {
      return null;
    }
  }

  async getById(userId: number): Promise<UsersIdentity | null> {
    try {
      const { data } = await axios.get(`${this.baseUrl}/users/${userId}`);
      return data?.id ? data : null;
    } catch {
      return null;
    }
  }
}