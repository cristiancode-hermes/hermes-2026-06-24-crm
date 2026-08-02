import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { Deal } from './entities/deal.entity';
import { CreateDealDto } from './dto/create-deal.dto';
import { UpdateDealDto } from './dto/update-deal.dto';
import { UpdateDealStatusDto } from './dto/update-deal-status.dto';

@Injectable()
export class DealsService {
  constructor(
    @InjectRepository(Deal)
    private readonly dealRepository: Repository<Deal>,
  ) {}

  async findAll(
    organizationId: number,
    filters?: { stage?: string; contactId?: number },
  ): Promise<Deal[]> {
    const where: FindOptionsWhere<Deal> = { organizationId };

    if (filters?.stage) {
      where.stage = filters.stage;
    }
    if (filters?.contactId) {
      where.contactId = filters.contactId;
    }

    return this.dealRepository.find({
      where,
      relations: { contact: true },
      order: { position: 'ASC', createdAt: 'DESC' },
    });
  }

  async findOne(id: number, organizationId: number): Promise<Deal> {
    const deal = await this.dealRepository.findOne({
      where: { id, organizationId },
      relations: { contact: true, activities: true },
    });
    if (!deal) {
      throw new NotFoundException('Deal not found');
    }
    return deal;
  }

  async create(dto: CreateDealDto, organizationId: number): Promise<Deal> {
    const deal = this.dealRepository.create({
      ...dto,
      stage: dto.stage ?? 'Nuevo',
      organizationId,
    });
    return this.dealRepository.save(deal);
  }

  async update(
    id: number,
    dto: UpdateDealDto,
    organizationId: number,
  ): Promise<Deal> {
    const deal = await this.findOne(id, organizationId);
    Object.assign(deal, dto);
    return this.dealRepository.save(deal);
  }

  async remove(id: number, organizationId: number): Promise<void> {
    const deal = await this.findOne(id, organizationId);
    await this.dealRepository.remove(deal);
  }

  async updateStatus(
    id: number,
    dto: UpdateDealStatusDto,
    organizationId: number,
  ): Promise<Deal> {
    const deal = await this.findOne(id, organizationId);
    deal.stage = dto.stage;
    deal.position = dto.position;
    return this.dealRepository.save(deal);
  }

  async getKpi(organizationId: number) {
    const deals = await this.dealRepository.find({
      where: { organizationId },
    });

    const activeStages = ['Nuevo', 'Calificado', 'Propuesta', 'Negociación'];
    const wonDeals = deals.filter((d) => d.stage === 'Cerrado Ganado');
    const lostDeals = deals.filter((d) => d.stage === 'Cerrado Perdido');
    const activeDeals = deals.filter((d) => activeStages.includes(d.stage));

    const pipelineValue = activeDeals.reduce((sum, d) => sum + d.value, 0);
    const wonValue = wonDeals.reduce((sum, d) => sum + d.value, 0);

    const totalClosed = wonDeals.length + lostDeals.length;
    const conversionRate =
      totalClosed > 0 ? (wonDeals.length / totalClosed) * 100 : 0;

    const stages = [
      'Nuevo',
      'Calificado',
      'Propuesta',
      'Negociación',
      'Cerrado Ganado',
      'Cerrado Perdido',
    ];
    const stageValues = stages.map((stage) => {
      const stageDeals = deals.filter((d) => d.stage === stage);
      return {
        stage,
        value: stageDeals.reduce((sum, d) => sum + d.value, 0),
        count: stageDeals.length,
      };
    });

    return {
      totalDeals: deals.length,
      pipelineValue,
      wonValue,
      conversionRate: Math.round(conversionRate * 100) / 100,
      stageValues,
    };
  }

  async getUpcoming(organizationId: number): Promise<Deal[]> {
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const todayStr = today.toISOString().split('T')[0];
    const nextWeekStr = nextWeek.toISOString().split('T')[0];

    const deals = await this.dealRepository.find({
      where: { organizationId },
      relations: { contact: true },
    });

    return deals.filter((d) => {
      if (!d.expectedCloseDate) return false;
      return (
        d.expectedCloseDate >= todayStr && d.expectedCloseDate <= nextWeekStr
      );
    });
  }

  async exportCsv(organizationId: number, stage?: string) {
    const deals = await this.findAll(organizationId, { stage });

    const escape = (v: unknown): string => {
      const s = v == null ? '' : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };

    const header = ['name', 'value', 'stage', 'contact', 'expected_close', 'notes', 'created_at'];
    const rows = deals.map((d) => [
      d.name,
      d.value,
      d.stage,
      d.contact?.name ?? '',
      d.expectedCloseDate ?? '',
      d.notes,
      d.createdAt ? new Date(d.createdAt).toISOString() : '',
    ]);

    return {
      filename: `deals-${new Date().toISOString().slice(0, 10)}.csv`,
      csv: [header, ...rows].map((r) => r.map(escape).join(',')).join('\n'),
    };
  }
}
