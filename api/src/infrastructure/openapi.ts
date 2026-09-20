const routeDefinitions: Array<[string, string, boolean]> = [
  ['get','/ping',false], ['get','/health',false], ['get','/health/live',false], ['get','/health/ready',false], ['get','/health/config',false],
  ['post','/auth/google',false], ['post','/auth/google/upgrade',true], ['get','/auth/google/refresh-token',true], ['post','/auth/dev/bypass',false],
  ['post','/auth/email/sign-up',false], ['post','/auth/email/verify',false], ['post','/auth/email/sign-in',false], ['post','/auth/email/resend-code',false],
  ['post','/auth/email/forgot-password',false], ['post','/auth/email/reset-password',false], ['get','/auth/verify',false], ['post','/auth/refresh',true],
  ['post','/auth/signout',false], ['get','/auth/me',true], ['get','/users/me/settings',true], ['patch','/users/me/settings',true],
  ['get','/users',true], ['put','/admin/users/{userId}/role',true], ['get','/users/{id}',true], ['get','/users/google/{googleId}',true], ['delete','/users/{id}',true],
  ['get','/admin/settings/allowed_users',true], ['post','/admin/settings/allowed_users',true], ['delete','/admin/settings/allowed_users/{email}',true],
  ['get','/example/items',true], ['post','/example/items',true], ['get','/admin/example/items',true],
  ['get','/media/assets',true], ['post','/media/assets/multipart',true], ['post','/media/assets/data-url',true], ['get','/media/assets/{id}',true],
  ['get','/admin/media/assets',true], ['post','/admin/media/assets/multipart',true], ['post','/admin/media/assets/data-url',true],
  ['get','/notifications/me',true], ['post','/push/subscribe',true], ['delete','/push/subscribe',true], ['get','/push/vapid-public',true],
  ['post','/diagnostics/client-errors',false], ['get','/admin/diagnostics/client-errors',true], ['get','/admin/audit-events',true], ['get','/admin/audit-events/export',true],
];

export const apiOpenApiDocument = {
  openapi: '3.0.3',
  info: { title: 'Application Scaffold API', version: '1.0.0', description: 'Shared HTTP contract for the Node, Go, and Rust API scaffolds.' },
  servers: [{ url: '/api' }],
  components: { securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } } },
  paths: routeDefinitions.reduce<Record<string, Record<string, unknown>>>((paths, [method, path, protectedRoute]) => {
    paths[path] ??= {};
    paths[path][method] = {
      operationId: `${method}_${path.replace(/\//g, '_').replace(/[{}]/g, '')}`,
      security: protectedRoute ? [{ bearerAuth: [] }] : [],
      responses: { default: { description: 'JSON response according to the cross-backend compatibility contract.' } },
    };
    return paths;
  }, {}),
};

export const apiDocsHtml = `<!doctype html><html><head><meta charset="utf-8"><title>Application Scaffold API</title><link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css"></head><body><div id="swagger-ui"></div><script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script><script>SwaggerUIBundle({url:'/api/openapi.json',dom_id:'#swagger-ui'});</script></body></html>`;
