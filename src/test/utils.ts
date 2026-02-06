import Database from "better-sqlite3";
import { readFileSync } from "fs";
import { resolve } from "path";

export function createTestDb(): Database.Database {
  const db = new Database(":memory:");
  const schemaPath = resolve(process.cwd(), "db/schema.sql");
  const schema = readFileSync(schemaPath, "utf-8");
  db.exec(schema);
  db.pragma("foreign_keys = ON");
  return db;
}
