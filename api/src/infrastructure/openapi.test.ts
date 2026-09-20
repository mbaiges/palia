import { apiOpenApiDocument } from './openapi';

describe('shared OpenAPI contract', () => {
  it('preserves multiple methods declared on a single path', () => {
    expect(apiOpenApiDocument.paths['/users/me/settings']).toHaveProperty('get');
    expect(apiOpenApiDocument.paths['/users/me/settings']).toHaveProperty('patch');
    expect(apiOpenApiDocument.paths['/push/subscribe']).toHaveProperty('post');
    expect(apiOpenApiDocument.paths['/push/subscribe']).toHaveProperty('delete');
    expect(apiOpenApiDocument.paths['/users/{id}']).toHaveProperty('get');
    expect(apiOpenApiDocument.paths['/users/{id}']).toHaveProperty('delete');
  });
});
