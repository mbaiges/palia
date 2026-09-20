import crypto from 'crypto';
import type { Client } from '@libsql/client';
import type { CreateExampleItemInput, ExampleItem } from '@/domain/models/ExampleItem';
import type { ExampleItemRepository } from '@/domain/repositories/ExampleItemRepository';
import { DatabaseConfig } from '@/infrastructure/config/database';
import { queryAll, execute } from '@/infrastructure/db/libsql';

type ExampleItemRow = {
  id: string;
  owner_id: string;
  title: string;
  description: string;
  status: 'active' | 'archived';
  image_id: string | null;
  created_at: string;
  updated_at: string;
};

function mapRow(row: ExampleItemRow): ExampleItem {
  return {
    id: row.id,
    ownerId: row.owner_id,
    title: row.title,
    description: row.description,
    status: row.status,
    imageId: row.image_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class SqliteExampleItemRepository implements ExampleItemRepository {
  private readonly client: Client;

  constructor() {
    this.client = DatabaseConfig.getConnection();
  }

  async findByOwnerId(ownerId: string): Promise<ExampleItem[]> {
    const rows = await queryAll<ExampleItemRow>(
      this.client,
      'SELECT id, owner_id, title, description, status, image_id, created_at, updated_at FROM example_items WHERE owner_id = ? ORDER BY created_at DESC',
      [ownerId]
    );
    return rows.map(mapRow);
  }

  async findAll(): Promise<ExampleItem[]> {
    const rows = await queryAll<ExampleItemRow>(
      this.client,
      'SELECT id, owner_id, title, description, status, image_id, created_at, updated_at FROM example_items ORDER BY created_at DESC'
    );
    return rows.map(mapRow);
  }

  async create(ownerId: string, input: CreateExampleItemInput): Promise<ExampleItem> {
    const now = new Date().toISOString();
    const item: ExampleItem = {
      id: crypto.randomUUID(),
      ownerId,
      title: input.title.trim(),
      description: input.description?.trim() ?? '',
      status: 'active',
      imageId: input.imageId ?? null,
      createdAt: now,
      updatedAt: now,
    };
    await execute(
      this.client,
      'INSERT INTO example_items (id, owner_id, title, description, status, image_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [item.id, item.ownerId, item.title, item.description, item.status, item.imageId, item.createdAt, item.updatedAt]
    );
    return item;
  }
}
