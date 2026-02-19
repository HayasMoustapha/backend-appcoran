// Minimal OpenAPI 3.0 documentation for the API.
const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'AppCoran API',
    version: '1.1.0'
  },
  servers: [{ url: 'http://localhost:4000' }],
  tags: [
    { name: 'Health', description: 'Service health checks' },
    { name: 'Auth', description: 'Admin authentication' },
    { name: 'Audio', description: 'Audio CRUD and stats' },
    { name: 'Public', description: 'Public audio and profile access' },
    { name: 'Profile', description: 'Imam profile management' },
    { name: 'Dashboard', description: 'Admin statistics' },
    { name: 'Reference', description: 'Reference datasets' }
  ],
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
          share_count: { type: 'integer' },
          basmala_added: { type: 'boolean' },
          created_at: { type: 'string' },
          updated_at: { type: 'string' }
        }
      },
      Profile: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          biography: { type: 'string' },
          parcours: { type: 'string' },
          statut: { type: 'string' },
          photo_url: { type: 'string' }
        }
      },
      SurahReference: {
        type: 'object',
        properties: {
          number: { type: 'integer' },
          name_fr: { type: 'string' },
          name_phonetic: { type: 'string' },
          name_ar: { type: 'string' },
          revelation: { type: 'integer' },
          verses: { type: 'integer' },
          words: { type: 'integer' },
          letters: { type: 'integer' }
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
    '/health': {
      get: { tags: ['Health'], summary: 'Health check', responses: { 200: { description: 'OK' } } }
    },
    '/health/ffmpeg': {
      get: { tags: ['Health'], summary: 'FFmpeg/FFprobe check', responses: { 200: { description: 'OK' }, 503: { description: 'Missing tools' } } }
    },
    '/api/surah-reference': {
      get: {
        tags: ['Reference'],
        summary: 'Get Surah reference dataset (ordered by number)',
        responses: {
          200: {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/SurahReference' }
                },
                example: [
                  {
                    number: 1,
                    name_fr: "L'Ouverture",
                    name_phonetic: 'Al-Fatihah',
                    name_ar: 'الفاتحة',
                    revelation: 5,
                    verses: 7,
                    words: 29,
                    letters: 139
                  }
                ]
              }
            }
          }
        }
      }
    },
    '/api/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register admin',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AuthRequest' },
              example: { email: 'imam@example.com', password: 'ChangeMe123!' }
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
        tags: ['Auth'],
        summary: 'Login',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AuthRequest' },
              example: { email: 'imam@example.com', password: 'ChangeMe123!' }
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
      get: { tags: ['Audio'], summary: 'List audios', responses: { 200: { description: 'OK' } } },
      post: {
        tags: ['Audio'],
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
                },
                required: ['file', 'title', 'sourate', 'numeroSourate']
              },
              example: {
                title: 'Al-Fatiha',
                sourate: 'Al-Fatiha',
                numeroSourate: 1,
                versetStart: 1,
                versetEnd: 7,
                description: 'Sample',
                addBasmala: false
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
      get: { tags: ['Audio'], summary: 'Search audios', responses: { 200: { description: 'OK' } } }
    },
    '/api/audios/popular': { get: { tags: ['Audio'], summary: 'Most popular', responses: { 200: { description: 'OK' } } } },
    '/api/audios/top-listened': { get: { tags: ['Audio'], summary: 'Top listened', responses: { 200: { description: 'OK' } } } },
    '/api/audios/top-downloaded': { get: { tags: ['Audio'], summary: 'Top downloaded', responses: { 200: { description: 'OK' } } } },
    '/api/audios/recent': { get: { tags: ['Audio'], summary: 'Most recent', responses: { 200: { description: 'OK' } } } },
    '/api/audios/{id}': {
      get: { tags: ['Audio'], summary: 'Get audio (increments view_count)', responses: { 200: { description: 'OK' }, 404: { description: 'Not found' } } },
      put: { tags: ['Audio'], summary: 'Update audio', security: [{ bearerAuth: [] }], responses: { 200: { description: 'OK' }, 401: { description: 'Unauthorized' } } },
      delete: { tags: ['Audio'], summary: 'Delete audio', security: [{ bearerAuth: [] }], responses: { 200: { description: 'OK' }, 401: { description: 'Unauthorized' } } }
    },
    '/api/audios/{id}/stream': {
      get: { tags: ['Audio'], summary: 'Stream audio', responses: { 206: { description: 'Partial' }, 200: { description: 'OK' } } }
    },
    '/api/audios/{id}/download': {
      get: { tags: ['Audio'], summary: 'Download audio', responses: { 200: { description: 'OK' } } }
    },
    '/public/audios/{slug}': {
      get: { tags: ['Public'], summary: 'Public audio by slug', responses: { 200: { description: 'OK' } } }
    },
    '/public/audios/{slug}/stream': {
      get: { tags: ['Public'], summary: 'Stream public audio by slug', responses: { 206: { description: 'Partial' }, 200: { description: 'OK' } } }
    },
    '/public/audios/{slug}/download': {
      get: { tags: ['Public'], summary: 'Download public audio by slug', responses: { 200: { description: 'OK' } } }
    },
    '/public/audios/{slug}/share': {
      post: { tags: ['Public'], summary: 'Share public audio (increments share_count)', responses: { 200: { description: 'OK' } } }
    },
    '/api/profile': {
      post: { tags: ['Profile'], summary: 'Create profile', security: [{ bearerAuth: [] }], responses: { 201: { description: 'Created' } } },
      get: { tags: ['Profile'], summary: 'Get profile (admin)', security: [{ bearerAuth: [] }], responses: { 200: { description: 'OK' } } },
      put: { tags: ['Profile'], summary: 'Update profile', security: [{ bearerAuth: [] }], responses: { 200: { description: 'OK' } } },
      delete: { tags: ['Profile'], summary: 'Delete profile', security: [{ bearerAuth: [] }], responses: { 200: { description: 'OK' } } }
    },
    '/api/profile/public': {
      get: { tags: ['Profile'], summary: 'Public profile', responses: { 200: { description: 'OK' } } }
    },
    '/public/profile': {
      get: { tags: ['Public'], summary: 'Public profile (frontend)', responses: { 200: { description: 'OK' } } }
    },
    '/api/dashboard/overview': {
      get: { tags: ['Dashboard'], summary: 'Dashboard overview', security: [{ bearerAuth: [] }], responses: { 200: { description: 'OK' } } }
    },
    '/api/dashboard/performance': {
      get: { tags: ['Dashboard'], summary: 'Dashboard performance', security: [{ bearerAuth: [] }], responses: { 200: { description: 'OK' } } }
    },
    '/api/dashboard/stats': {
      get: { tags: ['Dashboard'], summary: 'Dashboard stats by period', security: [{ bearerAuth: [] }], responses: { 200: { description: 'OK' } } }
    }
  }
};

export default swaggerDocument;
