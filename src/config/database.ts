import sqlite3 from 'sqlite3';
import { Database, open } from 'sqlite';

let db: Database | null = null;

export const getDb = async (): Promise<Database> => {
  if (db) return db;
  db = await open({
    filename: process.env.NODE_ENV === 'test' ? ':memory:' : './data.db',
    driver: sqlite3.Database,
  });
  return db;
};

export const closeDb = async (): Promise<void> => {
  if (db) {
    await db.close();
    db = null;
  }
};