import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ContactsService } from './contacts.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { Request } from 'express';

@ApiTags('Contacts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/contacts')
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Get()
  @ApiOperation({ summary: 'List contacts with pagination and search' })
  async findAll(
    @Req() req: Request,
    @Query() query: PaginationQueryDto,
  ) {
    const user = req.user as { organizationId: number };
    return this.contactsService.findAll(user.organizationId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single contact with deals and activities' })
  async findOne(
    @Req() req: Request,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const user = req.user as { organizationId: number };
    return this.contactsService.findOne(id, user.organizationId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new contact' })
  async create(
    @Req() req: Request,
    @Body() dto: CreateContactDto,
  ) {
    const user = req.user as { organizationId: number };
    return this.contactsService.create(dto, user.organizationId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a contact' })
  async update(
    @Req() req: Request,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateContactDto,
  ) {
    const user = req.user as { organizationId: number };
    return this.contactsService.update(id, dto, user.organizationId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a contact' })
  async remove(
    @Req() req: Request,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const user = req.user as { organizationId: number };
    await this.contactsService.remove(id, user.organizationId);
    return { message: 'Contact deleted successfully' };
  }
}
