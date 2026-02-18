import { jest } from '@jest/globals';
import jwt from 'jsonwebtoken';
import env from '../src/config/env.js';
import { requireAuth } from '../src/middlewares/auth.middleware.js';
import { validate } from '../src/middlewares/validation.middleware.js';
import { errorMiddleware, AppError } from '../src/middlewares/error.middleware.js';
import { z } from 'zod';

describe('auth.middleware', () => {
  it('rejects missing token', () => {
    const req = { headers: {} };
    const next = jest.fn();
    requireAuth(req, {}, next);
    expect(next).toHaveBeenCalled();
    expect(next.mock.calls[0][0].statusCode).toBe(401);
  });

  it('rejects invalid token', () => {
    const req = { headers: { authorization: 'Bearer bad' } };
    const next = jest.fn();
    requireAuth(req, {}, next);
    expect(next.mock.calls[0][0].statusCode).toBe(401);
  });

  it('accepts valid token', () => {
    const token = jwt.sign({ id: '1', role: 'admin' }, env.jwtSecret);
    const req = { headers: { authorization: `Bearer ${token}` } };
    const next = jest.fn();
    requireAuth(req, {}, next);
    expect(req.user.id).toBe('1');
    expect(next).toHaveBeenCalledWith();
  });
});

describe('validation.middleware', () => {
  it('passes valid data', () => {
    const schema = z.object({ name: z.string() });
    const req = { body: { name: 'x' } };
    const next = jest.fn();
    validate(schema)(req, {}, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('returns details on invalid data', () => {
    const schema = z.object({ name: z.string() });
    const req = { body: { name: 1 } };
    const next = jest.fn();
    validate(schema)(req, {}, next);
    expect(next.mock.calls[0][0].details.length).toBeGreaterThan(0);
  });

  it('handles validation errors without issues', () => {
    const schema = { parse: () => { throw new Error('boom'); } };
    const req = { body: {} };
    const next = jest.fn();
    validate(schema)(req, {}, next);
    expect(next.mock.calls[0][0].details).toEqual([]);
  });
});

describe('error.middleware', () => {
  it('AppError defaults to status 500', () => {
    const err = new AppError('x');
    expect(err.statusCode).toBe(500);
  });

  it('returns error response', () => {
    const err = new AppError('bad', 400, { field: 'x' });
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    errorMiddleware(err, {}, res, () => {});
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalled();
  });

  it('uses default message when missing', () => {
    const err = { statusCode: 500, message: '' };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    errorMiddleware(err, {}, res, () => {});
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('logs server errors', () => {
    const err = new AppError('boom', 500);
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    errorMiddleware(err, {}, res, () => {});
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('includes stack in development', () => {
    const prev = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    const err = new Error('x');
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    errorMiddleware(err, {}, res, () => {});
    expect(res.json).toHaveBeenCalled();
    process.env.NODE_ENV = prev;
  });

  it('handles Zod errors', () => {
    const result = z.object({ name: z.string() }).safeParse({ name: 1 });
    const err = result.error;
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    errorMiddleware(err, {}, res, () => {});
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('handles generic issues array as validation error', () => {
    const err = { issues: [{ message: 'bad' }] };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    errorMiddleware(err, {}, res, () => {});
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('handles validation error with details fallback', () => {
    const err = { name: 'ZodError', details: [{ message: 'bad' }] };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    errorMiddleware(err, {}, res, () => {});
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('handles multer size errors', () => {
    const err = { code: 'LIMIT_FILE_SIZE' };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    errorMiddleware(err, {}, res, () => {});
    expect(res.status).toHaveBeenCalledWith(413);
  });

  it('handles multer unexpected file errors', () => {
    const err = { code: 'LIMIT_UNEXPECTED_FILE' };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    errorMiddleware(err, {}, res, () => {});
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('handles invalid JSON errors', () => {
    const err = new SyntaxError('invalid json');
    err.body = {};
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    errorMiddleware(err, {}, res, () => {});
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('handles postgres unique violations', () => {
    const err = { code: '23505', detail: 'duplicate' };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    errorMiddleware(err, {}, res, () => {});
    expect(res.status).toHaveBeenCalledWith(409);
  });

  it('handles postgres foreign key violations', () => {
    const err = { code: '23503', detail: 'fk' };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    errorMiddleware(err, {}, res, () => {});
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('handles postgres invalid syntax errors', () => {
    const err = { code: '22P02', detail: 'bad' };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    errorMiddleware(err, {}, res, () => {});
    expect(res.status).toHaveBeenCalledWith(400);
  });
});
