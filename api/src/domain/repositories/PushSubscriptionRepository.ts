export interface PushSubscriptionRecord {
  id: string;
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  createdAt: string;
  locale?: string | null;
}

export interface PushSubscriptionInput {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  locale?: string | null;
}

export interface PushSubscriptionRepository {
  save(userId: string, subscription: PushSubscriptionInput): Promise<void>;
  findByUserId(userId: string): Promise<PushSubscriptionRecord[]>;
  deleteByUserAndEndpoint(userId: string, endpoint: string): Promise<void>;
  deleteByEndpoint(endpoint: string): Promise<void>;
  deleteByEndpointIfExists(endpoint: string): Promise<void>;
}
