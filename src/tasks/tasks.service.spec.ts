import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TasksService } from './tasks.service';
import { Task } from './entities/task.entity';
import { User } from '../users/entities/user.entity';

describe('TasksService', () => {
  let service: TasksService;

  const tasksRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };
  const usersRepository = {
    findOneBy: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: getRepositoryToken(Task), useValue: tasksRepository },
        { provide: getRepositoryToken(User), useValue: usersRepository },
      ],
    }).compile();
    service = module.get(TasksService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('getAllTasks returns tasks from the repository', async () => {
    tasksRepository.find.mockResolvedValue([{ id: 1, title: 'Task one' }]);
    expect(await service.getAllTasks()).toEqual([{ id: 1, title: 'Task one' }]);
  });

  it('deleteTask returns false when the task does not exist', async () => {
    tasksRepository.findOneBy.mockResolvedValue(null);
    expect(await service.deleteTask(999)).toBe(false);
  });

  it('createTask throws NotFoundException for an unknown user', async () => {
    tasksRepository.create.mockReturnValue({ title: 'Task' });
    usersRepository.findOneBy.mockResolvedValue(null);
    await expect(
      service.createTask({ title: 'Task', userId: 999 }),
    ).rejects.toThrow(NotFoundException);
  });
});