const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'AppCoran API',
    version: '1.0.0'
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
          verset_start: { type: 'integer' },
          verset_end: { type: 'integer' },
          description: { type: 'string' },
          file_path: { type: 'string' },
          basmala_added: { type: 'boolean' },
          created_at: { type: 'string' },
          updated_at: { type: 'string' }
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
      get: {
        summary: 'List audios',
        responses: { 200: { description: 'OK' } }
      },
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
    '/api/audios/{id}': {
      get: { summary: 'Get audio', responses: { 200: { description: 'OK' }, 404: { description: 'Not found' } } },
      put: { summary: 'Update audio', security: [{ bearerAuth: [] }], responses: { 200: { description: 'OK' }, 401: { description: 'Unauthorized' } } },
      delete: { summary: 'Delete audio', security: [{ bearerAuth: [] }], responses: { 200: { description: 'OK' }, 401: { description: 'Unauthorized' } } }
    },
    '/api/audios/{id}/stream': {
      get: { summary: 'Stream audio', responses: { 206: { description: 'Partial' }, 200: { description: 'OK' } } }
    },
    '/api/audios/{id}/download': {
      get: { summary: 'Download audio', responses: { 200: { description: 'OK' } } }
    }
  }
};

export default swaggerDocument;
