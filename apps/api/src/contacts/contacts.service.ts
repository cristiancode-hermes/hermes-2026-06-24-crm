import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindOptionsWhere } from 'typeorm';
import { Contact } from './entities/contact.entity';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { PaginationQueryDto, PaginatedResult } from '../common/dto/pagination.dto';

@Injectable()
export class ContactsService {
  constructor(
    @InjectRepository(Contact)
    private readonly contactRepository: Repository<Contact>,
  ) {}

  async findAll(
    organizationId: number,
    query: PaginationQueryDto,
  ): Promise<PaginatedResult<Contact>> {
    const { page = 1, limit = 10, q, sortBy, sortOrder = 'DESC' } = query;

    const where: FindOptionsWhere<Contact> = { organizationId };

    if (q) {
      where.name = Like(`%${q}%`);
    }

    const [data, total] = await this.contactRepository.findAndCount({
      where,
      order: sortBy ? { [sortBy]: sortOrder } : { createdAt: 'DESC' },
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

  async findOne(id: number, organizationId: number): Promise<Contact> {
    const contact = await this.contactRepository.findOne({
      where: { id, organizationId },
      relations: { deals: true, activities: true },
    });
    if (!contact) {
      throw new NotFoundException('Contact not found');
    }
    return contact;
  }

  async create(dto: CreateContactDto, organizationId: number): Promise<Contact> {
    const contact = this.contactRepository.create({
      ...dto,
      organizationId,
    });
    return this.contactRepository.save(contact);
  }

  async update(id: number, dto: UpdateContactDto, organizationId: number): Promise<Contact> {
    const contact = await this.findOne(id, organizationId);
    Object.assign(contact, dto);
    return this.contactRepository.save(contact);
  }

  async remove(id: number, organizationId: number): Promise<void> {
    const contact = await this.findOne(id, organizationId);
    await this.contactRepository.remove(contact);
  }
}
