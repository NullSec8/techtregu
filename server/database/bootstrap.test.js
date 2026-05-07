import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('dotenv', () => ({ config: vi.fn() }));

import { ensureDatabase } from './bootstrap.js';
import { initSchema } from './initSchema.js';

describe('bootstrap — ensureDatabase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.MYSQL_HOST = 'bootstrap-test';
    process.env.MYSQL_PORT = '3307';
    process.env.MYSQL_USER = 'test-user';
    process.env.MYSQL_PASSWORD = 'test-pass';
    process.env.MYSQL_DATABASE = 'test_db';
  });

  it('creates database when it does not exist', async () => {
    const conn = { query: vi.fn().mockResolvedValue(), end: vi.fn().mockResolvedValue() };
    const mockMysql = { createConnection: vi.fn().mockResolvedValue(conn) };

    await ensureDatabase(mockMysql);

    expect(mockMysql.createConnection).toHaveBeenCalledWith({
      host: 'bootstrap-test',
      port: 3307,
      user: 'test-user',
      password: 'test-pass',
    });
    expect(conn.query).toHaveBeenCalledWith(
      expect.stringContaining('CREATE DATABASE IF NOT EXISTS'),
    );
    expect(conn.query).toHaveBeenCalledWith(
      expect.stringContaining('`test_db`'),
    );
    expect(conn.query).toHaveBeenCalledWith(
      expect.stringContaining('utf8mb4'),
    );
    expect(conn.end).toHaveBeenCalledOnce();
  });

  it('handles existing database', async () => {
    const conn = { query: vi.fn().mockResolvedValue(), end: vi.fn().mockResolvedValue() };
    const mockMysql = { createConnection: vi.fn().mockResolvedValue(conn) };

    await expect(ensureDatabase(mockMysql)).resolves.toBeUndefined();
    expect(conn.query).toHaveBeenCalledTimes(1);
    expect(conn.end).toHaveBeenCalledOnce();
  });

  it('throws when MySQL connection fails', async () => {
    const mockMysql = { createConnection: vi.fn().mockRejectedValue(new Error('Connection refused by host')) };

    await expect(ensureDatabase(mockMysql)).rejects.toThrow('Connection refused by host');
    expect(mockMysql.createConnection).toHaveBeenCalledOnce();
  });

  it('throws when the CREATE DATABASE query fails', async () => {
    const conn = { query: vi.fn().mockRejectedValue(new Error('Access denied for user')), end: vi.fn() };
    const mockMysql = { createConnection: vi.fn().mockResolvedValue(conn) };

    await expect(ensureDatabase(mockMysql)).rejects.toThrow('Access denied for user');
    expect(conn.end).not.toHaveBeenCalled();
  });

  it('uses default values when environment variables are not set', async () => {
    delete process.env.MYSQL_HOST;
    delete process.env.MYSQL_PORT;
    delete process.env.MYSQL_USER;
    delete process.env.MYSQL_PASSWORD;
    delete process.env.MYSQL_DATABASE;

    const conn = { query: vi.fn().mockResolvedValue(), end: vi.fn().mockResolvedValue() };
    const mockMysql = { createConnection: vi.fn().mockResolvedValue(conn) };

    await ensureDatabase(mockMysql);

    expect(mockMysql.createConnection).toHaveBeenCalledWith({
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: '',
    });
  });
});

describe('initSchema', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls pool.query for each SQL statement', async () => {
    const mockQuery = vi.fn().mockResolvedValue();
    const mockPool = { query: mockQuery };

    await initSchema(mockPool);

    // STATEMENTS contains 20 items: 9 CREATE TABLE + 9 CREATE INDEX + 2 ALTER TABLE
    expect(mockQuery).toHaveBeenCalledTimes(20);
  });

  it('ignores duplicate key name errors', async () => {
    const mockQuery = vi.fn()
      .mockResolvedValueOnce()
      .mockRejectedValueOnce(new Error('Duplicate key name'))
      .mockResolvedValue();
    const mockPool = { query: mockQuery };

    await expect(initSchema(mockPool)).resolves.toBeUndefined();
  });

  it('ignores "table already exists" errors', async () => {
    const mockQuery = vi.fn()
      .mockResolvedValueOnce()
      .mockRejectedValueOnce(new Error("Table 'users' already exists"))
      .mockResolvedValue();
    const mockPool = { query: mockQuery };

    await expect(initSchema(mockPool)).resolves.toBeUndefined();
  });

  it('ignores duplicate column name errors', async () => {
    const mockQuery = vi.fn()
      .mockResolvedValueOnce()
      .mockRejectedValueOnce(new Error('Duplicate column name'))
      .mockResolvedValue();
    const mockPool = { query: mockQuery };

    await expect(initSchema(mockPool)).resolves.toBeUndefined();
  });

  it('ignores generic "duplicate key" errors', async () => {
    const mockQuery = vi.fn()
      .mockResolvedValueOnce()
      .mockRejectedValueOnce(new Error('Duplicate key'))
      .mockResolvedValue();
    const mockPool = { query: mockQuery };

    await expect(initSchema(mockPool)).resolves.toBeUndefined();
  });

  it('logs unknown errors without throwing', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const mockQuery = vi.fn()
      .mockResolvedValueOnce()
      .mockRejectedValueOnce(new Error('Unknown schema error'))
      .mockResolvedValue();
    const mockPool = { query: mockQuery };

    await initSchema(mockPool);

    expect(consoleSpy).toHaveBeenCalledWith('Schema init error:', 'Unknown schema error');
    consoleSpy.mockRestore();
  });

  it('continues executing remaining statements after a transient error', async () => {
    const mockQuery = vi.fn()
      .mockResolvedValueOnce()
      .mockRejectedValueOnce(new Error('Duplicate key name'))
      .mockResolvedValue();
    const mockPool = { query: mockQuery };

    await initSchema(mockPool);

    expect(mockQuery).toHaveBeenCalledTimes(20);
  });
});
