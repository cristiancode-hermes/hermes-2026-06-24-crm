import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ActivitiesService } from './activities.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { Request } from 'express';

@ApiTags('Activities')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/activities')
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Get()
  @ApiOperation({ summary: 'List activities, filterable by contactId and dealId' })
  @ApiQuery({ name: 'contactId', required: false, type: Number })
  @ApiQuery({ name: 'dealId', required: false, type: Number })
  async findAll(
    @Req() req: Request,
    @Query() query: PaginationQueryDto,
    @Query('contactId') contactId?: string,
    @Query('dealId') dealId?: string,
  ) {
    const user = req.user as { organizationId: number };
    return this.activitiesService.findAll(user.organizationId, query, {
      contactId: contactId ? parseInt(contactId, 10) : undefined,
      dealId: dealId ? parseInt(dealId, 10) : undefined,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single activity' })
  async findOne(
    @Req() req: Request,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const user = req.user as { organizationId: number };
    return this.activitiesService.findOne(id, user.organizationId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new activity' })
  async create(
    @Req() req: Request,
    @Body() dto: CreateActivityDto,
  ) {
    const user = req.user as { organizationId: number };
    return this.activitiesService.create(dto, user.organizationId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an activity' })
  async remove(
    @Req() req: Request,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const user = req.user as { organizationId: number };
    await this.activitiesService.remove(id, user.organizationId);
    return { message: 'Activity deleted successfully' };
  }
}
