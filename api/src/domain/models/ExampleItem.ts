export type ExampleItemStatus = 'active' | 'archived';

export interface ExampleItem {
  id: string;
  ownerId: string;
  title: string;
  description: string;
  status: ExampleItemStatus;
  imageId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateExampleItemInput {
  title: string;
  description?: string;
  imageId?: string | null;
}
