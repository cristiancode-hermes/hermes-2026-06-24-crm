import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { DealsService } from './deals.service';
import { CreateDealDto } from './dto/create-deal.dto';
import { UpdateDealDto } from './dto/update-deal.dto';
import { UpdateDealStatusDto } from './dto/update-deal-status.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { Request } from 'express';

@ApiTags('Deals')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/deals')
export class DealsController {
  constructor(private readonly dealsService: DealsService) {}

  @Get()
  @ApiOperation({ summary: 'List deals, filterable by stage and contactId' })
  @ApiQuery({ name: 'stage', required: false })
  @ApiQuery({ name: 'contactId', required: false, type: Number })
  async findAll(
    @Req() req: Request,
    @Query('stage') stage?: string,
    @Query('contactId') contactId?: string,
  ) {
    const user = req.user as { organizationId: number };
    return this.dealsService.findAll(user.organizationId, {
      stage,
      contactId: contactId ? parseInt(contactId, 10) : undefined,
    });
  }

  @Get('kpi')
  @ApiOperation({ summary: 'Get pipeline KPIs' })
  async getKpi(@Req() req: Request) {
    const user = req.user as { organizationId: number };
    return this.dealsService.getKpi(user.organizationId);
  }

  @Get('upcoming')
  @ApiOperation({ summary: 'Get deals closing in the next 7 days' })
  async getUpcoming(@Req() req: Request) {
    const user = req.user as { organizationId: number };
    return this.dealsService.getUpcoming(user.organizationId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single deal with contact and activities' })
  async findOne(
    @Req() req: Request,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const user = req.user as { organizationId: number };
    return this.dealsService.findOne(id, user.organizationId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new deal' })
  async create(
    @Req() req: Request,
    @Body() dto: CreateDealDto,
  ) {
    const user = req.user as { organizationId: number };
    return this.dealsService.create(dto, user.organizationId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a deal' })
  async update(
    @Req() req: Request,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDealDto,
  ) {
    const user = req.user as { organizationId: number };
    return this.dealsService.update(id, dto, user.organizationId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a deal' })
  async remove(
    @Req() req: Request,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const user = req.user as { organizationId: number };
    await this.dealsService.remove(id, user.organizationId);
    return { message: 'Deal deleted successfully' };
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update deal stage and position (drag-and-drop)' })
  async updateStatus(
    @Req() req: Request,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDealStatusDto,
  ) {
    const user = req.user as { organizationId: number };
    return this.dealsService.updateStatus(id, dto, user.organizationId);
  }
}
