import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { DealsService } from './deals.service';
import { Deal } from './entities/deal.entity';

describe('DealsService', () => {
  let service: DealsService;
  let repository: jest.Mocked<Repository<Deal>>;

  const mockDeal: Deal = {
    id: 1,
    name: 'Big Deal',
    value: 10000,
    stage: 'Nuevo',
    position: 0,
    expectedCloseDate: null,
    notes: null,
    contactId: 1,
    contact: null as any,
    organizationId: 1,
    organization: null as any,
    activities: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DealsService,
        {
          provide: getRepositoryToken(Deal),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<DealsService>(DealsService);
    repository = module.get(getRepositoryToken(Deal));
  });

  describe('findAll', () => {
    it('should return all deals for an organization', async () => {
      repository.find.mockResolvedValue([mockDeal]);

      const result = await service.findAll(1);

      expect(result).toEqual([mockDeal]);
      expect(repository.find).toHaveBeenCalledWith({
        where: { organizationId: 1 },
        relations: { contact: true },
        order: { position: 'ASC', createdAt: 'DESC' },
      });
    });

    it('should filter by stage when provided', async () => {
      repository.find.mockResolvedValue([mockDeal]);

      await service.findAll(1, { stage: 'Nuevo' });

      expect(repository.find).toHaveBeenCalledWith({
        where: { organizationId: 1, stage: 'Nuevo' },
        relations: { contact: true },
        order: { position: 'ASC', createdAt: 'DESC' },
      });
    });
  });

  describe('findOne', () => {
    it('should return a deal by id and organization', async () => {
      repository.findOne.mockResolvedValue(mockDeal);

      const result = await service.findOne(1, 1);

      expect(result).toEqual(mockDeal);
    });

    it('should throw NotFoundException when deal not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne(99, 1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a deal with default stage Nuevo', async () => {
      const dto = { name: 'New Deal', value: 5000, contactId: 1 };
      repository.create.mockReturnValue(mockDeal);
      repository.save.mockResolvedValue(mockDeal);

      const result = await service.create(dto, 1);

      expect(result).toEqual(mockDeal);
      expect(repository.create).toHaveBeenCalledWith({
        ...dto,
        stage: 'Nuevo',
        organizationId: 1,
      });
    });
  });

  describe('getKpi', () => {
    it('should calculate correct KPIs from deals', async () => {
      const wonDeal = {
        ...mockDeal,
        id: 1,
        value: 15000,
        stage: 'Cerrado Ganado',
      };
      const lostDeal = {
        ...mockDeal,
        id: 2,
        value: 5000,
        stage: 'Cerrado Perdido',
      };
      const activeDeal = {
        ...mockDeal,
        id: 3,
        value: 10000,
        stage: 'Negociación',
      };
      repository.find.mockResolvedValue([wonDeal, lostDeal, activeDeal]);

      const kpi = await service.getKpi(1);

      expect(kpi).toEqual({
        totalDeals: 3,
        pipelineValue: 10000,
        wonValue: 15000,
        conversionRate: 50,
        stageValues: expect.arrayContaining([
          expect.objectContaining({
            stage: 'Cerrado Ganado',
            value: 15000,
            count: 1,
          }),
          expect.objectContaining({
            stage: 'Cerrado Perdido',
            value: 5000,
            count: 1,
          }),
          expect.objectContaining({
            stage: 'Negociación',
            value: 10000,
            count: 1,
          }),
        ]),
      });
    });

    it('should return zero conversion rate when no closed deals', async () => {
      const deal = { ...mockDeal, stage: 'Nuevo' };
      repository.find.mockResolvedValue([deal]);

      const kpi = await service.getKpi(1);

      expect(kpi.conversionRate).toBe(0);
      expect(kpi.totalDeals).toBe(1);
    });
  });

  describe('updateStatus', () => {
    it('should update deal stage and position', async () => {
      repository.findOne.mockResolvedValue(mockDeal);
      repository.save.mockResolvedValue({
        ...mockDeal,
        stage: 'Calificado',
        position: 1,
      });

      const result = await service.updateStatus(
        1,
        { stage: 'Calificado', position: 1 },
        1,
      );

      expect(result.stage).toBe('Calificado');
      expect(result.position).toBe(1);
      expect(repository.save).toHaveBeenCalled();
    });
  });
});
