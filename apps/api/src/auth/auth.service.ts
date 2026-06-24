import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from '../organizations/entities/organization.entity';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    @InjectRepository(Organization)
    private readonly orgRepository: Repository<Organization>,
  ) {}

  async register(dto: RegisterDto): Promise<{ accessToken: string; user: { id: number; name: string; email: string; organizationId: number } }> {
    const slug = dto.orgName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const existingOrg = await this.orgRepository.findOne({ where: { slug } });
    if (existingOrg) {
      throw new ConflictException('Organization slug already exists');
    }

    const org = this.orgRepository.create({ name: dto.orgName, slug });
    const savedOrg = await this.orgRepository.save(org);

    try {
      const user = await this.usersService.createUser({
        name: dto.userName,
        email: dto.email,
        password: dto.password,
        organizationId: savedOrg.id,
      });

      const payload = { sub: user.id, email: user.email, organizationId: user.organizationId };
      const accessToken = this.jwtService.sign(payload);

      return {
        accessToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          organizationId: user.organizationId,
        },
      };
    } catch (err) {
      await this.orgRepository.delete(savedOrg.id);
      throw err;
    }
  }

  async login(dto: LoginDto): Promise<{ accessToken: string; user: { id: number; name: string; email: string; organizationId: number } }> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await this.usersService.validatePassword(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: user.id, email: user.email, organizationId: user.organizationId };
    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        organizationId: user.organizationId,
      },
    };
  }

  async getProfile(userId: number): Promise<{ id: number; name: string; email: string; role: string; organizationName: string; organizationId: number }> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      organizationName: user.organization?.name ?? '',
      organizationId: user.organizationId,
    };
  }
}
