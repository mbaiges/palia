import type { CreateExampleItemInput, ExampleItem } from '@/domain/models/ExampleItem';

export interface ExampleItemRepository {
  findByOwnerId(ownerId: string): Promise<ExampleItem[]>;
  findAll(): Promise<ExampleItem[]>;
  create(ownerId: string, input: CreateExampleItemInput): Promise<ExampleItem>;
}
