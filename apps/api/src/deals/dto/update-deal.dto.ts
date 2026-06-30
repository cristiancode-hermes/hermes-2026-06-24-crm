import { IsString, IsNumber, IsOptional, IsInt, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

const VALID_STAGES = [
  'Nuevo',
  'Calificado',
  'Propuesta',
  'Negociación',
  'Cerrado Ganado',
  'Cerrado Perdido',
];

export class UpdateDealDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  value?: number;

  @ApiPropertyOptional({ enum: VALID_STAGES })
  @IsOptional()
  @IsString()
  @IsIn(VALID_STAGES)
  stage?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  contactId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  expectedCloseDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
