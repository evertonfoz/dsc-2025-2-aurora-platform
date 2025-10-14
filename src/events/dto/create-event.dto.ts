import { IsString, Length, IsISO8601, IsOptional, IsInt, Min, IsEnum, IsUrl } from 'class-validator';
import { EventVisibility } from '../entities/event.entity';

export class CreateEventDto {
  @IsString()
  @Length(1, 180)
  title: string;

  @IsString()
  @Length(1, 280)
  summary: string;

  @IsString()
  description: string;

  @IsISO8601()
  startsAt: string;

  @IsISO8601()
  endsAt: string;

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
  slug?: string;
}