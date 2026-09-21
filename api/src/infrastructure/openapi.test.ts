import { apiOpenApiDocument } from './openapi';

describe('shared OpenAPI contract', () => {
  it('preserves multiple methods declared on a single path', () => {
    expect(apiOpenApiDocument.paths['/users/me/settings']).toHaveProperty(
      'get'
    );
    expect(apiOpenApiDocument.paths['/users/me/settings']).toHaveProperty(
      'patch'
    );
    expect(apiOpenApiDocument.paths['/push/subscribe']).toHaveProperty('post');
    expect(apiOpenApiDocument.paths['/push/subscribe']).toHaveProperty(
      'delete'
    );
    expect(apiOpenApiDocument.paths['/users/{id}']).toHaveProperty('get');
    expect(apiOpenApiDocument.paths['/users/{id}']).toHaveProperty('delete');
  });

  it('documents Medice browser sessions and CSRF protection instead of Bearer auth', () => {
    expect(apiOpenApiDocument.components.securitySchemes).toHaveProperty(
      'browserSession'
    );
    expect(apiOpenApiDocument.components.securitySchemes).toHaveProperty(
      'csrfToken'
    );
    expect(
      apiOpenApiDocument.paths['/patients/{patientId}/follow-ups'].post
    ).toMatchObject({
      security: [{ browserSession: [] }],
      parameters: [{ in: 'header', name: 'X-CSRF-Token', required: true }],
    });
    expect(apiOpenApiDocument.paths['/auth/email/sign-in']).toBeUndefined();
    expect(apiOpenApiDocument.paths['/auth/google'].post).toMatchObject({
      parameters: [
        {
          in: 'header',
          name: 'X-Requested-With',
          required: true,
          schema: { enum: ['XmlHttpRequest'] },
        },
      ],
    });
  });
});
