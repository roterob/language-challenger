/**
 * Meteor Data Migration Script
 *
 * Migra datos exportados de MongoDB (formato Meteor) al nuevo SQLite.
 *
 * Uso:
 *   1. Exportar colecciones de MongoDB:
 *      mongoexport --db meteor --collection resources --out resources.json --jsonArray
 *      mongoexport --db meteor --collection lists --out lists.json --jsonArray
 *      mongoexport --db meteor --collection users --out users.json --jsonArray
 *
 *   2. Ejecutar:
 *      npx tsx src/db/migrate-meteor.ts --resources=resources.json --lists=lists.json --users=users.json
 */

import { readFileSync, existsSync } from 'node:fs';
import { db } from './index';
import { users, resources, lists, listResources, userStats } from './schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

interface MeteorResource {
  _id: string;
  resourceCode?: string;
  code?: string; // alias legacy
  type: string;
  info?: {
    es?: { text?: string; audio?: string };
    en?: { text?: string; audio?: string };
  };
  tags?: string[];
  createdAt?: { $date: string } | string;
  updatedAt?: { $date: string } | string;
}

interface MeteorList {
  _id: string;
  name?: string;
  title?: string; // alias legacy
  tags?: string[];
  resources?: string[];
  createdAt?: { $date: string } | string;
}

interface MeteorUser {
  _id: string;
  username: string;
  emails?: Array<{ address: string }>;
  profile?: { displayName?: string; isAdmin?: boolean; isGuest?: boolean; uiSettings?: any };
  services?: { password?: { bcrypt?: string } };
}

function parseDate(d: any): Date {
  if (!d) return new Date();
  if (typeof d === 'string') return new Date(d);
  if (d.$date) return new Date(d.$date);
  return new Date();
}

function parseArgs(): Record<string, string> {
  const args: Record<string, string> = {};
  for (const arg of process.argv.slice(2)) {
    const match = arg.match(/^--(\w+)=(.+)$/);
    if (match) args[match[1]] = match[2];
  }
  return args;
}

async function migrateUsers(filePath: string) {
  if (!existsSync(filePath)) {
    console.log(`  ⚠️  ${filePath} not found, skipping users`);
    return new Map<string, string>();
  }

  const meteorUsers: MeteorUser[] = JSON.parse(readFileSync(filePath, 'utf-8'));
  console.log(`  📥 Found ${meteorUsers.length} Meteor users`);

  const idMap = new Map<string, string>();

  for (const mu of meteorUsers) {
    const existing = db.select().from(users).where(eq(users.username, mu.username)).get();
    if (existing) {
      idMap.set(mu._id, existing.id);
      continue;
    }

    // Use Meteor bcrypt hash directly or create a default password
    const passwordHash = mu.services?.password?.bcrypt || (await bcrypt.hash('changeme', 10));

    const [inserted] = db
      .insert(users)
      .values({
        username: mu.username,
        email: mu.emails?.[0]?.address || `${mu.username}@migrated.local`,
        passwordHash,
        displayName: mu.profile?.displayName || mu.username,
        isAdmin: mu.profile?.isAdmin ?? false,
        isGuest: mu.profile?.isGuest ?? false,
        uiSettings: mu.profile?.uiSettings ? JSON.stringify(mu.profile.uiSettings) : '{}',
      })
      .returning();

    idMap.set(mu._id, inserted.id);
    console.log(`    ✅ User "${mu.username}" migrated`);
  }

  return idMap;
}

function migrateResources(filePath: string) {
  if (!existsSync(filePath)) {
    console.log(`  ⚠️  ${filePath} not found, skipping resources`);
    return new Map<string, string>();
  }

  const meteorResources: MeteorResource[] = JSON.parse(readFileSync(filePath, 'utf-8'));
  console.log(`  📥 Found ${meteorResources.length} Meteor resources`);

  const idMap = new Map<string, string>();
  let created = 0;
  let skipped = 0;

  for (const mr of meteorResources) {
    // Check if already exists by resourceCode
    const resourceCode = mr.resourceCode || mr.code;
    if (resourceCode) {
      const existing = db.select().from(resources).where(eq(resources.code, resourceCode)).get();
      if (existing) {
        idMap.set(mr._id, existing.id);
        skipped++;
        continue;
      }
    }

    const [inserted] = db
      .insert(resources)
      .values({
        code: mr.resourceCode || mr.code || `MIG-${mr._id.slice(0, 8)}`,
        type: (mr.type as 'phrase' | 'vocabulary' | 'paragraph') || 'phrase',
        contentEs: mr.info?.es?.text || '',
        contentEn: mr.info?.en?.text || '',
        contentEsAudio: mr.info?.es?.audio || null,
        contentEnAudio: mr.info?.en?.audio || null,
        tags: JSON.stringify(mr.tags || []),
        createdAt: parseDate(mr.createdAt).toISOString(),
        updatedAt: parseDate(mr.updatedAt).toISOString(),
      })
      .returning();

    idMap.set(mr._id, inserted.id);
    created++;
  }

  console.log(`    ✅ Resources: ${created} created, ${skipped} skipped`);
  return idMap;
}

function migrateLists(filePath: string, resourceIdMap: Map<string, string>) {
  if (!existsSync(filePath)) {
    console.log(`  ⚠️  ${filePath} not found, skipping lists`);
    return;
  }

  const meteorLists: MeteorList[] = JSON.parse(readFileSync(filePath, 'utf-8'));
  console.log(`  📥 Found ${meteorLists.length} Meteor lists`);

  let created = 0;
  let skipped = 0;
  let totalLinks = 0;

  for (const ml of meteorLists) {
    const listName = ml.name || ml.title || 'Untitled';

    // Deduplicar por nombre exacto
    const existing = db.select().from(lists).where(eq(lists.name, listName)).get();
    if (existing) {
      skipped++;
      continue;
    }

    const [inserted] = db
      .insert(lists)
      .values({
        name: listName,
        tags: JSON.stringify(ml.tags || []),
        createdAt: parseDate(ml.createdAt).toISOString(),
      })
      .returning();

    // Vincular recursos
    const resourceIds = (ml.resources || [])
      .map((mid) => resourceIdMap.get(mid))
      .filter(Boolean) as string[];

    for (let i = 0; i < resourceIds.length; i++) {
      db.insert(listResources)
        .values({
          listId: inserted.id,
          resourceId: resourceIds[i],
          position: i,
        })
        .run();
    }

    totalLinks += resourceIds.length;
    created++;
  }

  console.log(
    `    ✅ Lists: ${created} created, ${skipped} skipped (${totalLinks} resource links)`,
  );
}

async function main() {
  const args = parseArgs();

  console.log('🔄 Starting Meteor data migration...\n');

  // Migrate users
  let userIdMap = new Map<string, string>();
  if (args.users) {
    console.log('👤 Migrating users...');
    userIdMap = await migrateUsers(args.users);
  }

  // Migrate resources
  let resourceIdMap = new Map<string, string>();
  if (args.resources) {
    console.log('📚 Migrating resources...');
    resourceIdMap = migrateResources(args.resources);
  }

  // Migrate lists
  if (args.lists) {
    console.log('📋 Migrating lists...');
    migrateLists(args.lists, resourceIdMap);
  }

  // Initialize user stats for all users
  console.log('📊 Initializing user stats...');
  const allUsers = db.select().from(users).all();
  for (const u of allUsers) {
    const existing = db.select().from(userStats).where(eq(userStats.userId, u.id)).get();
    if (!existing) {
      db.insert(userStats).values({ userId: u.id }).run();
    }
  }

  console.log('\n✅ Migration complete!');
}

main().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
