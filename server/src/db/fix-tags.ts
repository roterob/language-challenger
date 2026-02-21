/**
 * One-time fix: corrige los tags que fueron insertados con doble JSON.stringify
 * (almacenados como '"[\"tag1\",\"tag2\"]"' en lugar de '["tag1","tag2"]')
 */
import { sqlite } from './index';

// Resources
const badResources = sqlite
  .prepare(`SELECT id, tags FROM resources WHERE tags LIKE '"%'`)
  .all() as { id: string; tags: string }[];

console.log(`Resources con tags mal serializados: ${badResources.length}`);

const fixResource = sqlite.prepare('UPDATE resources SET tags = ? WHERE id = ?');
let fixedR = 0;
for (const r of badResources) {
  try {
    const parsed = JSON.parse(r.tags); // primer parse: quita las comillas externas
    const final = Array.isArray(parsed) ? parsed : JSON.parse(parsed);
    fixResource.run(JSON.stringify(final), r.id);
    fixedR++;
  } catch (e) {
    console.error(`Error fixing resource ${r.id}:`, e);
  }
}
console.log(`  ✅ Fixed ${fixedR} resources`);

// Lists
const badLists = sqlite.prepare(`SELECT id, tags FROM lists WHERE tags LIKE '"%'`).all() as {
  id: string;
  tags: string;
}[];

console.log(`Lists con tags mal serializados: ${badLists.length}`);

const fixList = sqlite.prepare('UPDATE lists SET tags = ? WHERE id = ?');
let fixedL = 0;
for (const l of badLists) {
  try {
    const parsed = JSON.parse(l.tags);
    const final = Array.isArray(parsed) ? parsed : JSON.parse(parsed);
    fixList.run(JSON.stringify(final), l.id);
    fixedL++;
  } catch (e) {
    console.error(`Error fixing list ${l.id}:`, e);
  }
}
console.log(`  ✅ Fixed ${fixedL} lists`);

console.log('\n✅ Done');
