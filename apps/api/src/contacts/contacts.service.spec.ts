import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { Contact } from './entities/contact.entity';

describe('ContactsService', () => {
  let service: ContactsService;
  let repository: jest.Mocked<Repository<Contact>>;

  const mockContact: Contact = {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    phone: '555-0100',
    company: 'Acme Corp',
    role: 'Manager',
    notes: 'Test note',
    organizationId: 1,
    organization: null as any,
    deals: [],
    activities: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContactsService,
        {
          provide: getRepositoryToken(Contact),
          useValue: {
            findAndCount: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ContactsService>(ContactsService);
    repository = module.get(getRepositoryToken(Contact));
  });

  describe('findAll', () => {
    it('should return paginated contacts', async () => {
      repository.findAndCount.mockResolvedValue([[mockContact], 1]);

      const result = await service.findAll(1, { page: 1, limit: 10 });

      expect(result).toEqual({
        data: [mockContact],
        total: 1,
        page: 1,
        totalPages: 1,
      });
      expect(repository.findAndCount).toHaveBeenCalledWith({
        where: { organizationId: 1 },
        order: { createdAt: 'DESC' },
        skip: 0,
        take: 10,
      });
    });

    it('should apply search filter when q is provided', async () => {
      repository.findAndCount.mockResolvedValue([[mockContact], 1]);

      await service.findAll(1, { page: 1, limit: 10, q: 'John' });

      expect(repository.findAndCount).toHaveBeenCalledWith({
        where: { organizationId: 1, name: expect.any(Object) },
        order: { createdAt: 'DESC' },
        skip: 0,
        take: 10,
      });
    });
  });

  describe('findOne', () => {
    it('should return a contact by id and organization', async () => {
      repository.findOne.mockResolvedValue(mockContact);

      const result = await service.findOne(1, 1);

      expect(result).toEqual(mockContact);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 1, organizationId: 1 },
        relations: { deals: true, activities: true },
      });
    });

    it('should throw NotFoundException when contact not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne(99, 1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a new contact', async () => {
      const dto = { name: 'Jane Doe', email: 'jane@example.com' };
      repository.create.mockReturnValue(mockContact);
      repository.save.mockResolvedValue(mockContact);

      const result = await service.create(dto, 1);

      expect(result).toEqual(mockContact);
      expect(repository.create).toHaveBeenCalledWith({
        ...dto,
        organizationId: 1,
      });
    });
  });

  describe('remove', () => {
    it('should delete a contact', async () => {
      repository.findOne.mockResolvedValue(mockContact);
      repository.remove.mockResolvedValue(mockContact);

      await service.remove(1, 1);

      expect(repository.remove).toHaveBeenCalledWith(mockContact);
    });
  });
});
