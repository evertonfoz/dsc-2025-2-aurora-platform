import {
  IsString,
  Length,
  IsISO8601,
  IsOptional,
  IsInt,
  Min,
  IsEnum,
  IsUrl,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { IsTrimmed, ToLower } from '@aurora/common';
import { EventVisibility } from '../enums/event-visibility.enum';

export class UpdateEventDto {
  @IsOptional()
  @IsString()
  @Length(1, 180)
  @IsTrimmed()
  title?: string;

  @IsOptional()
  @IsString()
  @Length(1, 280)
  @IsTrimmed()
  summary?: string;

  @IsOptional()
  @IsString()
  @IsTrimmed()
  description?: string;

  @IsOptional()
  @IsISO8601()
  startsAt?: string;

  @IsOptional()
  @IsISO8601()
  endsAt?: string;

  @IsOptional()
  @IsISO8601()
  registrationOpensAt?: string;

  @IsOptional()
  @IsISO8601()
  registrationClosesAt?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;

  @IsOptional()
  @IsEnum(EventVisibility)
  visibility?: EventVisibility;

  @IsOptional()
  @IsUrl()
  bannerUrl?: string;

  @IsOptional()
  @IsUrl()
  coverUrl?: string;

  @IsOptional()
  @IsString()
  @IsTrimmed()
  @Transform(ToLower())
  slug?: string;
}
