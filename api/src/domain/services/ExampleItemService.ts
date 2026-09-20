import { inject, injectable } from 'tsyringe';
import type { CreateExampleItemInput, ExampleItem } from '@/domain/models/ExampleItem';
import type { ExampleItemRepository } from '@/domain/repositories/ExampleItemRepository';
import { AppError } from '@/domain/errors/AppError';
import { ErrorCode } from '@/domain/errors/ErrorCodes';

@injectable()
export class ExampleItemService {
  constructor(
    @inject('ExampleItemRepository') private readonly repository: ExampleItemRepository
  ) {}

  async listForUser(userId: string): Promise<ExampleItem[]> {
    return this.repository.findByOwnerId(userId);
  }

  async listAll(): Promise<ExampleItem[]> {
    return this.repository.findAll();
  }

  async create(userId: string, input: CreateExampleItemInput): Promise<ExampleItem> {
    const title = input.title?.trim();
    if (!title) {
      throw new AppError('Title is required', ErrorCode.INVALID_INPUT);
    }
    if (title.length > 120) {
      throw new AppError('Title is too long', ErrorCode.INVALID_INPUT);
    }
    return this.repository.create(userId, { ...input, title });
  }
}
