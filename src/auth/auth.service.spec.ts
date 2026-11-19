import { ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { Role } from '../roles/entities/role.entity';

describe('AuthService', () => {
  let service: AuthService;

  const usersService = {
    findByUsernameOrEmail: jest.fn(),
    findByUsernameWithPassword: jest.fn(),
    createUser: jest.fn(),
  };
  const jwtService = { sign: jest.fn() };
  const rolesRepository = {
    findOneBy: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
        { provide: getRepositoryToken(Role), useValue: rolesRepository },
      ],
    }).compile();
    service = module.get(AuthService);
  });

  it('login returns an access token', () => {
    jwtService.sign.mockReturnValue('test-token');
    expect(service.login({ id: 1, username: 'ivan' })).toEqual({
      access_token: 'test-token',
    });
    expect(jwtService.sign).toHaveBeenCalledWith({ sub: 1, username: 'ivan' });
  });

  it('register throws ConflictException if the user already exists', async () => {
    usersService.findByUsernameOrEmail.mockResolvedValue({ id: 1 });
    await expect(
      service.register({
        username: 'ivan',
        email: 'ivan@mail.com',
        password: '123456',
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('validateUser returns null for a wrong password', async () => {
    const hash = await bcrypt.hash('right-password', 4);
    usersService.findByUsernameWithPassword.mockResolvedValue({
      id: 1,
      username: 'ivan',
      email: 'ivan@mail.com',
      password: hash,
    });
    expect(await service.validateUser('ivan', 'wrong-password')).toBeNull();
  });
});