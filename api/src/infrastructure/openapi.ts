const routeDefinitions: Array<[string, string, boolean]> = [
  ['get', '/ping', false],
  ['get', '/health', false],
  ['get', '/health/live', false],
  ['get', '/health/ready', false],
  ['get', '/health/config', false],
  ['post', '/auth/google', false],
  ['post', '/auth/google/upgrade', true],
  ['get', '/auth/google/refresh-token', true],
  ['post', '/auth/dev/bypass', false],
  ['post', '/auth/refresh', true],
  ['get', '/auth/csrf', false],
  ['post', '/auth/signout', false],
  ['get', '/auth/me', true],
  ['get', '/users/me/settings', true],
  ['patch', '/users/me/settings', true],
  ['get', '/users', true],
  ['put', '/admin/users/{userId}/role', true],
  ['get', '/users/{id}', true],
  ['get', '/users/google/{googleId}', true],
  ['delete', '/users/{id}', true],
  ['get', '/admin/settings/allowed_users', true],
  ['post', '/admin/settings/allowed_users', true],
  ['delete', '/admin/settings/allowed_users/{email}', true],
  ['get', '/example/items', true],
  ['post', '/example/items', true],
  ['get', '/admin/example/items', true],
  ['get', '/media/assets', true],
  ['post', '/media/assets/multipart', true],
  ['post', '/media/assets/data-url', true],
  ['get', '/media/assets/{id}', true],
  ['get', '/admin/media/assets', true],
  ['post', '/admin/media/assets/multipart', true],
  ['post', '/admin/media/assets/data-url', true],
  ['get', '/notifications/me', true],
  ['post', '/push/subscribe', true],
  ['delete', '/push/subscribe', true],
  ['get', '/push/vapid-public', true],
  ['post', '/diagnostics/client-errors', false],
  ['get', '/admin/diagnostics/client-errors', true],
  ['get', '/admin/audit-events', true],
  ['get', '/admin/audit-events/export', true],
  ['get', '/bootstrap', true],
  ['get', '/patients', true],
  ['post', '/patients', true],
  ['get', '/patients/{patientId}', true],
  ['patch', '/patients/{patientId}', true],
  ['post', '/patients/{patientId}/archive', true],
  ['post', '/patients/{patientId}/restore', true],
  ['put', '/patients/{patientId}/assignments', true],
  ['get', '/patients/{patientId}/follow-ups', true],
  ['post', '/patients/{patientId}/follow-ups', true],
  ['get', '/alerts', true],
  ['post', '/patients/{patientId}/alerts', true],
  ['post', '/alerts/{alertId}/resolve', true],
  ['get', '/hospitals', true],
  ['post', '/hospitals', true],
  ['patch', '/hospitals/{hospitalId}', true],
  ['post', '/hospitals/{hospitalId}/archive', true],
  ['post', '/hospitals/{hospitalId}/restore', true],
  ['get', '/volunteers', true],
  ['get', '/users/me/profile', true],
  ['patch', '/users/me/profile', true],
  ['get', '/coordinator/allowed-users', true],
  ['post', '/coordinator/allowed-users', true],
  ['get', '/stats/me', true],
  ['get', '/stats/global', true],
];

export const apiOpenApiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'Medice API',
    version: '1.0.0',
    description:
      'HTTP contract for the Medice browser application. Browser sessions use HttpOnly cookies; mutating requests also require the CSRF header.',
  },
  servers: [{ url: '/api' }],
  components: {
    securitySchemes: {
      browserSession: {
        type: 'apiKey',
        in: 'cookie',
        name: '__Host-medice_session',
      },
      csrfToken: { type: 'apiKey', in: 'header', name: 'X-CSRF-Token' },
    },
  },
  paths: routeDefinitions.reduce<Record<string, Record<string, unknown>>>(
    (paths, [method, path, protectedRoute]) => {
      paths[path] ??= {};
      paths[path][method] = {
        operationId: `${method}_${path.replace(/\//g, '_').replace(/[{}]/g, '')}`,
        security: protectedRoute ? [{ browserSession: [] }] : [],
        ...((protectedRoute &&
          ['post', 'put', 'patch', 'delete'].includes(method)) ||
        (path === '/auth/google' && method === 'post')
          ? {
              parameters: [
                ...(protectedRoute &&
                ['post', 'put', 'patch', 'delete'].includes(method)
                  ? [
                      {
                        in: 'header',
                        name: 'X-CSRF-Token',
                        required: true,
                        schema: { type: 'string' },
                      },
                    ]
                  : []),
                ...(path === '/auth/google' && method === 'post'
                  ? [
                      {
                        in: 'header',
                        name: 'X-Requested-With',
                        required: true,
                        schema: { type: 'string', enum: ['XmlHttpRequest'] },
                        description:
                          'Required by Google Identity Services for popup-code CSRF validation.',
                      },
                    ]
                  : []),
              ],
            }
          : {}),
        responses: {
          default: {
            description:
              'JSON response according to the cross-backend compatibility contract.',
          },
        },
      };
      return paths;
    },
    {}
  ),
};

export const apiDocsHtml = `<!doctype html><html><head><meta charset="utf-8"><title>Application Scaffold API</title><link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css"></head><body><div id="swagger-ui"></div><script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script><script>SwaggerUIBundle({url:'/api/openapi.json',dom_id:'#swagger-ui'});</script></body></html>`;
