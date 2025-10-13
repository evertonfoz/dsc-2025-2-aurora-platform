import { UserRole } from '../enums/user-role.enum';

export class QueryUsersDto {
  page?: number; // default 1
  limit?: number; // default 20, max. 100
  name?: string;
  email?: string;
  role?: UserRole;
  isActive?: boolean;
}
