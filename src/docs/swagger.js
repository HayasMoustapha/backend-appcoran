// Minimal OpenAPI 3.0 documentation for the API.
const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'AppCoran API',
    version: '1.1.0'
  },
  servers: [{ url: 'http://localhost:4000' }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer'
      }
    },
    schemas: {
      AuthRequest: {
        type: 'object',
        properties: {
          email: { type: 'string', example: 'imam@example.com' },
          password: { type: 'string', example: 'StrongPass123' }
        },
        required: ['email', 'password']
      },
      AuthResponse: {
        type: 'object',
        properties: {
          token: { type: 'string' },
          refreshToken: { type: ['string', 'null'] }
        }
      },
      Audio: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          sourate: { type: 'string' },
          numero_sourate: { type: 'integer' },
          verset_start: { type: 'integer' },
          verset_end: { type: 'integer' },
          description: { type: 'string' },
          file_path: { type: 'string' },
          slug: { type: 'string' },
          view_count: { type: 'integer' },
          listen_count: { type: 'integer' },
          download_count: { type: 'integer' },
          basmala_added: { type: 'boolean' },
          created_at: { type: 'string' },
          updated_at: { type: 'string' }
        }
      },
      Profile: {
        type: 'object',
        properties: {
          biography: { type: 'string' },
          parcours: { type: 'string' },
          statut: { type: 'string' },
          photo_url: { type: 'string' }
        }
      },
      Error: {
        type: 'object',
        properties: {
          error: { type: 'string' },
          details: { type: 'array', items: { type: 'object' } }
        }
      }
    }
  },
  paths: {
    '/api/auth/register': {
      post: {
        summary: 'Register admin',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AuthRequest' }
            }
          }
        },
        responses: {
          201: { description: 'Created' },
          409: { description: 'Email already registered', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
        }
      }
    },
    '/api/auth/login': {
      post: {
        summary: 'Login',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AuthRequest' }
            }
          }
        },
        responses: {
          200: { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } } },
          401: { description: 'Invalid credentials', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
        }
      }
    },
    '/api/audios': {
      get: { summary: 'List audios', responses: { 200: { description: 'OK' } } },
      post: {
        summary: 'Create audio',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  file: { type: 'string', format: 'binary' },
                  title: { type: 'string' },
                  sourate: { type: 'string' },
                  numeroSourate: { type: 'integer' },
                  versetStart: { type: 'integer' },
                  versetEnd: { type: 'integer' },
                  description: { type: 'string' },
                  addBasmala: { type: 'boolean' }
                }
              }
            }
          }
        },
        responses: {
          201: { description: 'Created', content: { 'application/json': { schema: { $ref: '#/components/schemas/Audio' } } } },
          400: { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
        }
      }
    },
    '/api/audios/search': {
      get: { summary: 'Search audios', responses: { 200: { description: 'OK' } } }
    },
    '/api/audios/popular': { get: { summary: 'Most popular', responses: { 200: { description: 'OK' } } } },
    '/api/audios/top-listened': { get: { summary: 'Top listened', responses: { 200: { description: 'OK' } } } },
    '/api/audios/top-downloaded': { get: { summary: 'Top downloaded', responses: { 200: { description: 'OK' } } } },
    '/api/audios/recent': { get: { summary: 'Most recent', responses: { 200: { description: 'OK' } } } },
    '/api/audios/{id}': {
      get: { summary: 'Get audio (increments view_count)', responses: { 200: { description: 'OK' }, 404: { description: 'Not found' } } },
      put: { summary: 'Update audio', security: [{ bearerAuth: [] }], responses: { 200: { description: 'OK' }, 401: { description: 'Unauthorized' } } },
      delete: { summary: 'Delete audio', security: [{ bearerAuth: [] }], responses: { 200: { description: 'OK' }, 401: { description: 'Unauthorized' } } }
    },
    '/api/audios/{id}/stream': {
      get: { summary: 'Stream audio', responses: { 206: { description: 'Partial' }, 200: { description: 'OK' } } }
    },
    '/api/audios/{id}/download': {
      get: { summary: 'Download audio', responses: { 200: { description: 'OK' } } }
    },
    '/public/audios/{slug}': {
      get: { summary: 'Public audio by slug', responses: { 200: { description: 'OK' } } }
    },
    '/api/profile': {
      post: { summary: 'Create profile', security: [{ bearerAuth: [] }], responses: { 201: { description: 'Created' } } },
      get: { summary: 'Get profile (admin)', security: [{ bearerAuth: [] }], responses: { 200: { description: 'OK' } } },
      put: { summary: 'Update profile', security: [{ bearerAuth: [] }], responses: { 200: { description: 'OK' } } },
      delete: { summary: 'Delete profile', security: [{ bearerAuth: [] }], responses: { 200: { description: 'OK' } } }
    },
    '/api/profile/public': {
      get: { summary: 'Public profile', responses: { 200: { description: 'OK' } } }
    },
    '/api/dashboard/overview': {
      get: { summary: 'Dashboard overview', security: [{ bearerAuth: [] }], responses: { 200: { description: 'OK' } } }
    },
    '/api/dashboard/performance': {
      get: { summary: 'Dashboard performance', security: [{ bearerAuth: [] }], responses: { 200: { description: 'OK' } } }
    },
    '/api/dashboard/stats': {
      get: { summary: 'Dashboard stats by period', security: [{ bearerAuth: [] }], responses: { 200: { description: 'OK' } } }
    }
  }
};

export default swaggerDocument;
