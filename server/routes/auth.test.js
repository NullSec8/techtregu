import { describe, it, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import cookieParser from 'cookie-parser';

const mockPool = vi.hoisted(() => {
  const Module = require('module');
  const queryFn = () => Promise.resolve([[], undefined]);
  const mPool = { query: queryFn, end: () => {} };
  const mysql2Path = require.resolve('mysql2/promise', {
    paths: [process.cwd() + '/server'],
  });
  const mysql2Mock = new Module(mysql2Path);
  mysql2Mock.exports = {
    createPool: () => mPool,
    createConnection: () => {},
    createPoolCluster: () => {},
    escape: (v) => v,
    escapeId: (v) => v,
  };
  mysql2Mock.loaded = true;
  Module._cache[mysql2Path] = mysql2Mock;
  return { query: (...args) => mPool.query(...args), __pool: mPool };
});

vi.mock('bcryptjs', () => {
  const m = {
    genSalt: vi.fn().mockResolvedValue('salt'),
    hash: vi.fn().mockResolvedValue('hash'),
    compare: vi.fn(),
  };
  return { default: m, ...m };
});

vi.mock('nodemailer', () => ({
  createTransport: vi.fn(() => ({
    sendMail: vi.fn().mockResolvedValue({ success: true, messageId: 'mid' }),
  })),
  default: {
    createTransport: vi.fn(() => ({
      sendMail: vi.fn().mockResolvedValue({ success: true, messageId: 'mid' }),
    })),
  },
}));

process.env.JWT_SECRET = 'test-jwt-secret-32-chars-min-for-hs256!!!';
import authRouter from './auth';
import * as bcryptNamespace from 'bcryptjs';
const bcrypt = bcryptNamespace.default;

function mockUserRow(overrides = {}) {
  return {
    id: 1, username: 'testuser', email: 'test@example.com',
    password: '$2a$10$hashed-password-mock',
    first_name: 'Test', last_name: 'User',
    phone: null, location: null, avatar: null,
    is_admin: 0, is_verified: 1,
    created_at: '2025-01-01T00:00:00.000Z',
    last_login: null, login_attempts: 0, locked_until: null,
    ...overrides,
  };
}

function createApp() {
  const app = express();
  app.use(cookieParser());
  app.use(express.json());
  app.use('/api/auth', authRouter);
  return app;
}

const selectResult = (rows) => [rows, undefined];
const updateResult = () => [{ affectedRows: 1 }, undefined];

describe('DEBUG', () => {
  let app;
  beforeEach(() => { vi.clearAllMocks(); app = createApp(); });

  it('login debug', async () => {
    mockPool.__pool.query = vi.fn()
      .mockResolvedValueOnce(selectResult([mockUserRow()]))
      .mockResolvedValueOnce(selectResult([]))
      .mockResolvedValueOnce(updateResult())
      .mockResolvedValueOnce(updateResult())
      .mockResolvedValueOnce(updateResult());
    bcrypt.compare.mockResolvedValue(true);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'StrongP1ss' });

    console.log('STATUS:', res.status);
    console.log('BODY:', JSON.stringify(res.body));
    console.log('QUERY CALLS:', mockPool.__pool.query.mock.calls.length);
    console.log('BCRYPT CALLED:', bcrypt.compare.mock.calls.length);
    
    // Try to extract which path failed
    const calls = mockPool.__pool.query.mock.calls;
    calls.forEach((c, i) => {
      const sql = typeof c[0] === 'string' ? c[0].substring(0, 80) : JSON.stringify(c[0]);
      console.log(`  Query ${i}: ${sql}`);
    });
  });
});
