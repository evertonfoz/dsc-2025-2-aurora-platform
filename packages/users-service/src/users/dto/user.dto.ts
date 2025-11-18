import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserDto {
  @ApiProperty({ example: '123' })
  id!: string;

  @ApiProperty({ example: 'user@example.com' })
  email!: string;

  @ApiPropertyOptional({ example: 'John Doe' })
  name?: string;

  @ApiPropertyOptional({ example: ['student'] })
  roles?: string[];

  @ApiPropertyOptional({ example: '2025-11-18T23:00:00.000Z' })
  lastLogoutAt?: string | null;
}
