import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { Role } from '../roles/entities/role.entity';
import { RegisterDto } from './dto/register.dto';

const ALLOWED_ROLES = ['user', 'administrator'];

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    @InjectRepository(Role)
    private readonly rolesRepository: Repository<Role>,
  ) {}

  async register(dto: RegisterDto) {
    if (!dto.username || !dto.email || !dto.password) {
      throw new BadRequestException('Нужны username, email и password');
    }
    const roleNames = dto.roles && dto.roles.length > 0 ? dto.roles : ['user'];
    for (const name of roleNames) {
      if (!ALLOWED_ROLES.includes(name)) {
        throw new BadRequestException(`Неизвестная роль: ${name}`);
      }
    }
    const existing = await this.usersService.findByUsernameOrEmail(
      dto.username,
      dto.email,
    );
    if (existing) {
      throw new ConflictException(
        'Пользователь с таким username или email уже существует',
      );
    }

    const roles: Role[] = [];
    for (const name of roleNames) {
      let role = await this.rolesRepository.findOneBy({ name });
      if (!role) {
        role = await this.rolesRepository.save(
          this.rolesRepository.create({ name }),
        );
      }
      roles.push(role);
    }

    const hash = await bcrypt.hash(dto.password, 10);
    const user = await this.usersService.createUser({
      username: dto.username,
      email: dto.email,
      password: hash,
      roles,
    });
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      roles: user.roles.map((role) => role.name),
    };
  }

  async validateUser(username: string, password: string) {
    const user = await this.usersService.findByUsernameWithPassword(username);
    if (user && (await bcrypt.compare(password, user.password))) {
      return { id: user.id, username: user.username, email: user.email };
    }
    return null;
  }

  login(user: { id: number; username: string }) {
    const payload = { sub: user.id, username: user.username };
    return { access_token: this.jwtService.sign(payload) };
  }
}