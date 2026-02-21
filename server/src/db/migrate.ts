import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { db } from './index';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

console.log('Running migrations...');
migrate(db, { migrationsFolder: resolve(__dirname, '../../drizzle') });
console.log('Migrations completed.');
