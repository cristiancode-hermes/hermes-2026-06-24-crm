import { IsString, IsOptional, IsIn, IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const VALID_TYPES = ['note', 'call', 'email', 'meeting'];

export class CreateActivityDto {
  @ApiProperty({ enum: VALID_TYPES })
  @IsString()
  @IsIn(VALID_TYPES)
  type: 'note' | 'call' | 'email' | 'meeting';

  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty()
  @IsString()
  date: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  contactId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  dealId?: number;
}
