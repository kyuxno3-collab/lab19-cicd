import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  NotFoundException,
  UseGuards,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  getAllTasks() {
    return this.tasksService.getAllTasks();
  }

  @Get('user/:userId')
  getTasksByUser(@Param('userId') userId: string) {
    return this.tasksService.getTasksByUser(Number(userId));
  }

  @Get(':id')
  async getTaskById(@Param('id') id: string) {
    const task = await this.tasksService.getTaskById(Number(id));
    if (!task) {
      throw new NotFoundException(`Задача с id ${id} не найдена`);
    }
    return task;
  }

  @Post()
  createTask(@Body() createTaskDto: CreateTaskDto) {
    return this.tasksService.createTask(createTaskDto);
  }

  @Put(':id')
  async updateTask(
    @Param('id') id: string,
    @Body() updateTaskDto: UpdateTaskDto,
  ) {
    const task = await this.tasksService.updateTask(Number(id), updateTaskDto);
    if (!task) {
      throw new NotFoundException(`Задача с id ${id} не найдена`);
    }
    return task;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('administrator')
  @Delete(':id')
  async deleteTask(@Param('id') id: string) {
    const deleted = await this.tasksService.deleteTask(Number(id));
    if (!deleted) {
      throw new NotFoundException(`Задача с id ${id} не найдена`);
    }
    return { message: `Задача ${id} удалена` };
  }
}