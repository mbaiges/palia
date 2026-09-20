import 'reflect-metadata';
import { TransactionContext } from '@/domain/models/TransactionContext';
import { User } from '@/domain/models/User';

declare global {
  namespace Express {
    export interface Request {
      user?: User;
      context?: TransactionContext;
    }
  }
}
