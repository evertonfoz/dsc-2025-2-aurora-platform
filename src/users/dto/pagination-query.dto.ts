import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  Min,
  Max,
  IsOptional,
  IsString,
  IsEnum,
  IsBoolean,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { UserRole } from '../domain/user-role.enum';

export class PaginationQueryDto {
  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page = 1;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 20 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit = 20;

  @ApiPropertyOptional({ description: 'Busca textual (name/email, ILIKE)' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsOptional()
  q?: string;

  @ApiPropertyOptional({ enum: UserRole, enumName: 'UserRole' })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @ApiPropertyOptional({
    type: Boolean,
    description: 'Filtra por ativo/inativo (aceita também ?is_active=...)',
  })
  @Transform(
    ({ value, obj }: { value: unknown; obj: Record<string, unknown> }) => {
      // suporta ?isActive=... e o alias ?is_active=...
      const raw = value ?? obj?.is_active;
      if (raw === undefined || raw === null || raw === '') return undefined;
      if (typeof raw === 'boolean') return raw;
      const v =
        typeof raw === 'string'
          ? raw.toLowerCase()
          : typeof raw === 'number' || typeof raw === 'boolean'
            ? String(raw).toLowerCase()
            : undefined;
      if (!v) return undefined;
      if (['true', '1', 'yes', 'y'].includes(v)) return true;
      if (['false', '0', 'no', 'n'].includes(v)) return false;
      return undefined;
    },
  )
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
