import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './entities/task.entity';
import { User } from '../users/entities/user.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly tasksRepository: Repository<Task>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  getAllTasks(): Promise<Task[]> {
    return this.tasksRepository.find();
  }

  getTaskById(id: number): Promise<Task | null> {
    return this.tasksRepository.findOne({
      where: { id },
      relations: { user: true },
    });
  }

  getTasksByUser(userId: number): Promise<Task[]> {
    return this.tasksRepository.find({ where: { user: { id: userId } } });
  }

  async createTask(dto: CreateTaskDto): Promise<Task> {
    const task = this.tasksRepository.create({
      title: dto.title,
      description: dto.description,
    });
    if (dto.userId !== undefined) {
      const user = await this.usersRepository.findOneBy({ id: dto.userId });
      if (!user) {
        throw new NotFoundException(`Пользователь с id ${dto.userId} не найден`);
      }
      task.user = user;
    }
    return this.tasksRepository.save(task);
  }

  async updateTask(id: number, dto: UpdateTaskDto): Promise<Task | null> {
    const task = await this.tasksRepository.findOneBy({ id });
    if (!task) {
      return null;
    }
    Object.assign(task, dto);
    return this.tasksRepository.save(task);
  }

  async deleteTask(id: number): Promise<boolean> {
    const task = await this.tasksRepository.findOneBy({ id });
    if (!task) {
      return false;
    }
    await this.tasksRepository.remove(task);
    return true;
  }
}