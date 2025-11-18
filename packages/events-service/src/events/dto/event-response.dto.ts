import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EventState } from '../enums/event-state.enum';
import { EventVisibility } from '../enums/event-visibility.enum';

export class EventResponseDto {
  @ApiProperty({ example: 123 })
  id: number;

  @ApiProperty({ example: 'tech-conf-2025' })
  slug: string;

  @ApiProperty({ example: 'Tech Conference 2025' })
  title: string;

  @ApiProperty({ example: 'Short summary' })
  summary: string;

  @ApiProperty({ example: 'Full description' })
  description: string;

  @ApiProperty({ enum: EventState })
  state: EventState;

  @ApiProperty({ enum: EventVisibility })
  visibility: EventVisibility;

  @ApiProperty({ example: '2025-12-01T10:00:00Z' })
  startsAt: string;

  @ApiProperty({ example: '2025-12-01T18:00:00Z' })
  endsAt: string;

  @ApiPropertyOptional({ example: '2025-11-01T00:00:00Z' })
  registrationOpensAt?: string;

  @ApiPropertyOptional({ example: '2025-11-30T23:59:59Z' })
  registrationClosesAt?: string;

  @ApiPropertyOptional({ example: 200 })
  capacity?: number;

  @ApiPropertyOptional({ example: 'https://example.com/banner.png' })
  bannerUrl?: string;

  @ApiPropertyOptional({ example: 'https://example.com/cover.png' })
  coverUrl?: string;

  @ApiProperty({ example: 42 })
  ownerUserId: number;

  @ApiProperty({ example: '2025-01-01T00:00:00Z' })
  createdAt: string;

  @ApiProperty({ example: '2025-01-02T00:00:00Z' })
  updatedAt: string;
}
