import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { Activity } from './entities/activity.entity';
import { CreateActivityDto } from './dto/create-activity.dto';
import {
  PaginationQueryDto,
  PaginatedResult,
} from '../common/dto/pagination.dto';

@Injectable()
export class ActivitiesService {
  constructor(
    @InjectRepository(Activity)
    private readonly activityRepository: Repository<Activity>,
  ) {}

  async findAll(
    organizationId: number,
    query: PaginationQueryDto,
    filters?: { contactId?: number; dealId?: number },
  ): Promise<PaginatedResult<Activity>> {
    const { page = 1, limit = 10, sortBy, sortOrder = 'DESC' } = query;

    const where: FindOptionsWhere<Activity> = { organizationId };

    if (filters?.contactId) {
      where.contactId = filters.contactId;
    }
    if (filters?.dealId) {
      where.dealId = filters.dealId;
    }

    const [data, total] = await this.activityRepository.findAndCount({
      where,
      relations: { contact: true, deal: true },
      order: sortBy
        ? { [sortBy]: sortOrder }
        : { date: 'DESC', createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number, organizationId: number): Promise<Activity> {
    const activity = await this.activityRepository.findOne({
      where: { id, organizationId },
      relations: { contact: true, deal: true },
    });
    if (!activity) {
      throw new NotFoundException('Activity not found');
    }
    return activity;
  }

  async create(
    dto: CreateActivityDto,
    organizationId: number,
  ): Promise<Activity> {
    const activity = this.activityRepository.create({
      ...dto,
      organizationId,
    });
    return this.activityRepository.save(activity);
  }

  async remove(id: number, organizationId: number): Promise<void> {
    const activity = await this.findOne(id, organizationId);
    await this.activityRepository.remove(activity);
  }

  async findRecentByOrg(
    organizationId: number,
    limit = 5,
  ): Promise<Activity[]> {
    return this.activityRepository.find({
      where: { organizationId },
      relations: { contact: true, deal: true },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}
