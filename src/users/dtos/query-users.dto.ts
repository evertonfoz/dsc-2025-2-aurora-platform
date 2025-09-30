import { UserRole } from '../domain/user-role.enum';

export class QueryUsersDto {
  page?: number; // default 1
  limit?: number; // default 20, máx. 100
  name?: string;
  email?: string;
  role?: UserRole;
  isActive?: boolean;
}
