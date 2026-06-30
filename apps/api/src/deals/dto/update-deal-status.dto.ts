import { IsString, IsInt, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

const VALID_STAGES = [
  'Nuevo',
  'Calificado',
  'Propuesta',
  'Negociación',
  'Cerrado Ganado',
  'Cerrado Perdido',
];

export class UpdateDealStatusDto {
  @ApiProperty({ enum: VALID_STAGES })
  @IsString()
  @IsIn(VALID_STAGES)
  stage: string;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  position: number;
}
