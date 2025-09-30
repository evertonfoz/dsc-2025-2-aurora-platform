// dto/paginated-users-response.dto.ts
import { UserResponseDto } from './user-response.dto';

export class PaginatedUsersResponseDto {
  data!: UserResponseDto[];
  total!: number;
  page!: number;
  limit!: number;
}
