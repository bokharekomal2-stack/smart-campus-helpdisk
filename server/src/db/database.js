import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from '../config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure the directory for the database file exists
const dbDir = path.dirname(config.databasePath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Open or create the persistent SQLite database
const db = new DatabaseSync(config.databasePath);

// Enable foreign keys and WAL mode for high performance and durability
db.exec('PRAGMA foreign_keys = ON;');
db.exec('PRAGMA journal_mode = WAL;');

// Initialize tables and indexes from schema.sql
const schemaPath = path.resolve(__dirname, 'schema.sql');
if (fs.existsSync(schemaPath)) {
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schemaSql);
}

/**
 * Database interface helpers
 */
export const database = {
  raw: db,

  /**
   * Execute multiple raw SQL statements
   */
  exec(sql) {
    return db.exec(sql);
  },

  /**
   * Run a query that returns multiple rows
   */
  all(sql, params = []) {
    const stmt = db.prepare(sql);
    return stmt.all(...params);
  },

  /**
   * Run a query that returns a single row
   */
  get(sql, params = []) {
    const stmt = db.prepare(sql);
    return stmt.get(...params);
  },

  /**
   * Run an INSERT, UPDATE, or DELETE statement
   * Returns { changes: number, lastInsertRowid: number }
   */
  run(sql, params = []) {
    const stmt = db.prepare(sql);
    const result = stmt.run(...params);
    return {
      changes: result.changes,
      lastInsertRowid: typeof result.lastInsertRowid === 'bigint' 
        ? Number(result.lastInsertRowid) 
        : result.lastInsertRowid,
    };
  },

  /**
   * Execute statements within a transaction
   */
  transaction(callback) {
    db.exec('BEGIN TRANSACTION;');
    try {
      const res = callback();
      db.exec('COMMIT;');
      return res;
    } catch (err) {
      db.exec('ROLLBACK;');
      throw err;
    }
  },

  /**
   * Close the database connection
   */
  close() {
    db.close();
  }
};

export default database;
