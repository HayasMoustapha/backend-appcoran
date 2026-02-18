import { jest } from '@jest/globals';

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
});

describe('env config', () => {
  it('throws when required env missing', async () => {
    jest.resetModules();
    process.env.NODE_ENV = 'development';
    process.env.DISABLE_DOTENV = 'true';
    delete process.env.DATABASE_URL;
    delete process.env.JWT_SECRET;

    await expect(import('../src/config/env.js')).rejects.toThrow('Missing required environment variable');
  });

  it('loads env with defaults', async () => {
    jest.resetModules();
    delete process.env.NODE_ENV;
    process.env.DISABLE_DOTENV = 'true';
    process.env.DATABASE_URL = 'postgresql://x';
    process.env.JWT_SECRET = 'secret';
    delete process.env.PORT;
    delete process.env.DB_ADMIN_DATABASE;
    delete process.env.JWT_EXPIRES_IN;
    delete process.env.REFRESH_TOKEN_SECRET;
    delete process.env.CORS_ORIGIN;
    delete process.env.UPLOAD_DIR;
    delete process.env.BASMALA_PATH;
    delete process.env.MAX_UPLOAD_MB;
    delete process.env.RATE_LIMIT_WINDOW_MS;
    delete process.env.RATE_LIMIT_MAX;
    delete process.env.AUTO_MIGRATE;
    delete process.env.AUTO_SEED;
    delete process.env.ADMIN_EMAIL;
    delete process.env.ADMIN_PASSWORD;
    delete process.env.KEEP_ORIGINAL_AUDIO;

    const env = (await import('../src/config/env.js')).default;
    expect(env.nodeEnv).toBe('development');
    expect(env.port).toBe(4000);
    expect(env.autoMigrate).toBe(true);
  });

  it('loads dotenv when enabled', async () => {
    jest.resetModules();
    const config = jest.fn();
    jest.unstable_mockModule('dotenv', () => ({ default: { config } }));
    process.env.NODE_ENV = 'development';
    process.env.DISABLE_DOTENV = 'false';
    process.env.DATABASE_URL = 'postgresql://x';
    process.env.JWT_SECRET = 'secret';

    await import('../src/config/env.js');
    expect(config).toHaveBeenCalled();
  });

  it('uses explicit env values', async () => {
    jest.resetModules();
    process.env.DISABLE_DOTENV = 'true';
    process.env.NODE_ENV = 'production';
    process.env.DATABASE_URL = 'postgresql://x';
    process.env.JWT_SECRET = 'secret';
    process.env.PORT = '5000';
    process.env.DB_ADMIN_DATABASE = 'admin';
    process.env.JWT_EXPIRES_IN = '2h';
    process.env.REFRESH_TOKEN_SECRET = 'refresh';
    process.env.CORS_ORIGIN = 'http://example.com';
    process.env.UPLOAD_DIR = '/tmp/uploads';
    process.env.BASMALA_PATH = '/tmp/basmala.mp3';
    process.env.MAX_UPLOAD_MB = '99';
    process.env.RATE_LIMIT_WINDOW_MS = '120000';
    process.env.RATE_LIMIT_MAX = '10';
    process.env.AUTO_MIGRATE = 'false';
    process.env.AUTO_SEED = 'false';
    process.env.ADMIN_EMAIL = 'admin@example.com';
    process.env.ADMIN_PASSWORD = 'secret123';
    process.env.KEEP_ORIGINAL_AUDIO = 'false';

    const env = (await import('../src/config/env.js')).default;
    expect(env.port).toBe(5000);
    expect(env.dbAdminDatabase).toBe('admin');
    expect(env.jwtExpiresIn).toBe('2h');
    expect(env.refreshTokenSecret).toBe('refresh');
    expect(env.corsOrigin).toBe('http://example.com');
    expect(env.uploadDir).toBe('/tmp/uploads');
    expect(env.basmalaPath).toBe('/tmp/basmala.mp3');
    expect(env.maxUploadMb).toBe(99);
    expect(env.rateLimitWindowMs).toBe(120000);
    expect(env.rateLimitMax).toBe(10);
    expect(env.autoMigrate).toBe(false);
    expect(env.autoSeed).toBe(false);
    expect(env.adminEmail).toBe('admin@example.com');
    expect(env.adminPassword).toBe('secret123');
    expect(env.keepOriginalAudio).toBe(false);
  });
});

describe('database config', () => {
  it('creates pool and query', async () => {
    jest.resetModules();
    const mockQuery = jest.fn().mockResolvedValue({ rows: [] });
    const Pool = class {
      constructor() {
        this.query = mockQuery;
      }
    };

    jest.unstable_mockModule('pg', () => ({
      default: { Pool }
    }));

    process.env.DATABASE_URL = 'postgresql://x';
    process.env.JWT_SECRET = 'secret';

    const db = await import('../src/config/database.js');
    await db.query('SELECT 1');
    expect(mockQuery).toHaveBeenCalled();
  });
});

describe('logger config', () => {
  it('creates logger', async () => {
    const logger = (await import('../src/config/logger.js')).default;
    expect(typeof logger.info).toBe('function');
  });
});

describe('migrations and seeds', () => {
  it('ensureDatabaseExists creates database if missing', async () => {
    jest.resetModules();
    const mockClient = {
      connect: jest.fn(),
      query: jest.fn()
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({}),
      end: jest.fn()
    };
    const Client = jest.fn(() => mockClient);

    jest.unstable_mockModule('pg', () => ({
      default: { Client }
    }));

    jest.unstable_mockModule('../src/config/database.js', () => ({
      pool: { connect: jest.fn() },
      query: jest.fn()
    }));

    process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/appcoran';
    process.env.JWT_SECRET = 'secret';

    const migrations = await import('../src/config/migrations.js');
    await migrations.ensureDatabaseExists();
    expect(Client).toHaveBeenCalled();
  });

  it('ensureDatabaseExists skips when exists', async () => {
    jest.resetModules();
    const mockClient = {
      connect: jest.fn(),
      query: jest.fn().mockResolvedValueOnce({ rows: [{ exists: 1 }] }),
      end: jest.fn()
    };
    const Client = jest.fn(() => mockClient);

    jest.unstable_mockModule('pg', () => ({
      default: { Client }
    }));

    jest.unstable_mockModule('../src/config/database.js', () => ({
      pool: { connect: jest.fn() },
      query: jest.fn()
    }));

    process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/appcoran';
    process.env.JWT_SECRET = 'secret';

    const migrations = await import('../src/config/migrations.js');
    await migrations.ensureDatabaseExists();
    expect(mockClient.query).toHaveBeenCalled();
  });

  it('runMigrations runs pending files', async () => {
    jest.resetModules();
    const mockClient = {
      query: jest.fn(),
      release: jest.fn()
    };
    const pool = { connect: jest.fn().mockResolvedValue(mockClient) };
    const query = jest.fn()
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ rows: [] });

    jest.unstable_mockModule('../src/config/database.js', () => ({ pool, query }));
    jest.unstable_mockModule('fs/promises', () => ({
      default: { readdir: jest.fn().mockResolvedValue(['001_init.sql']), readFile: jest.fn().mockResolvedValue('SELECT 1;') },
      readdir: jest.fn().mockResolvedValue(['001_init.sql']),
      readFile: jest.fn().mockResolvedValue('SELECT 1;')
    }));

    const migrations = await import('../src/config/migrations.js');
    await migrations.runMigrations();
    expect(pool.connect).toHaveBeenCalled();
  });

  it('runMigrations skips applied file', async () => {
    jest.resetModules();
    const mockClient = { query: jest.fn(), release: jest.fn() };
    const pool = { connect: jest.fn().mockResolvedValue(mockClient) };
    const query = jest.fn()
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ rows: [{ name: '001_init.sql' }] });

    jest.unstable_mockModule('../src/config/database.js', () => ({ pool, query }));
    jest.unstable_mockModule('fs/promises', () => ({
      default: { readdir: jest.fn().mockResolvedValue(['001_init.sql']), readFile: jest.fn().mockResolvedValue('SELECT 1;') },
      readdir: jest.fn().mockResolvedValue(['001_init.sql']),
      readFile: jest.fn().mockResolvedValue('SELECT 1;')
    }));

    const migrations = await import('../src/config/migrations.js');
    await migrations.runMigrations();
    expect(pool.connect).not.toHaveBeenCalled();
  });

  it('runMigrations rolls back on error', async () => {
    jest.resetModules();
    const mockClient = {
      query: jest.fn()
        .mockResolvedValueOnce()
        .mockRejectedValueOnce(new Error('bad')),
      release: jest.fn()
    };
    const pool = { connect: jest.fn().mockResolvedValue(mockClient) };
    const query = jest.fn()
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ rows: [] });

    jest.unstable_mockModule('../src/config/database.js', () => ({ pool, query }));
    jest.unstable_mockModule('fs/promises', () => ({
      default: { readdir: jest.fn().mockResolvedValue(['001_init.sql']), readFile: jest.fn().mockResolvedValue('SELECT 1;') },
      readdir: jest.fn().mockResolvedValue(['001_init.sql']),
      readFile: jest.fn().mockResolvedValue('SELECT 1;')
    }));

    const migrations = await import('../src/config/migrations.js');
    await expect(migrations.runMigrations()).rejects.toThrow('bad');
    expect(mockClient.query).toHaveBeenCalled();
  });

  it('seedAdmin inserts admin if missing', async () => {
    jest.resetModules();
    const query = jest.fn()
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({});

    jest.unstable_mockModule('../src/config/database.js', () => ({ query }));
    jest.unstable_mockModule('bcrypt', () => ({
      default: { hash: jest.fn().mockResolvedValue('hash') }
    }));

    process.env.ADMIN_EMAIL = 'imam@example.com';
    process.env.ADMIN_PASSWORD = 'pass';
    process.env.DATABASE_URL = 'postgresql://x';
    process.env.JWT_SECRET = 'secret';

    const seeds = await import('../src/config/seeds.js');
    await seeds.seedAdmin();
    expect(query).toHaveBeenCalled();
  });

  it('seedAdmin skips when env not set', async () => {
    jest.resetModules();
    jest.unstable_mockModule('../src/config/database.js', () => ({ query: jest.fn() }));
    process.env.ADMIN_EMAIL = '';
    process.env.ADMIN_PASSWORD = '';
    process.env.DATABASE_URL = 'postgresql://x';
    process.env.JWT_SECRET = 'secret';

    const seeds = await import('../src/config/seeds.js');
    await seeds.seedAdmin();
  });

  it('seedAdmin skips when user exists', async () => {
    jest.resetModules();
    const query = jest.fn().mockResolvedValue({ rows: [{ id: '1' }] });
    jest.unstable_mockModule('../src/config/database.js', () => ({ query }));
    process.env.ADMIN_EMAIL = 'imam@example.com';
    process.env.ADMIN_PASSWORD = 'pass';
    process.env.DATABASE_URL = 'postgresql://x';
    process.env.JWT_SECRET = 'secret';

    const seeds = await import('../src/config/seeds.js');
    await seeds.seedAdmin();
    expect(query).toHaveBeenCalled();
  });
});
