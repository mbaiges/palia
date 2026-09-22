import { dbService } from './db';
import { defaultApiRepository } from './repositories/apiRepository';

// The composition root. A future Firebase adapter can be selected here without
// making pages or application services aware of the concrete provider.
export const apiRepository = defaultApiRepository;
export { dbService };

