import { IsString, IsNumber, IsOptional, IsInt, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const VALID_STAGES = ['Nuevo', 'Calificado', 'Propuesta', 'Negociación', 'Cerrado Ganado', 'Cerrado Perdido'];

export class CreateDealDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  value: number;

  @ApiPropertyOptional({ enum: VALID_STAGES, default: 'Nuevo' })
  @IsOptional()
  @IsString()
  @IsIn(VALID_STAGES)
  stage?: string;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  contactId: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  expectedCloseDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
