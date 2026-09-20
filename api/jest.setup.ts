import 'reflect-metadata';
import { container } from 'tsyringe';

// Reset the DI container completely after each test.
afterEach(() => {
  container.reset();
});
