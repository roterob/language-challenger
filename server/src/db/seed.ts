import { db } from './index';
import { users, resources, lists, listResources, userStats } from './schema';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';

const SALT_ROUNDS = 10;

async function seed() {
  console.log('🌱 Seeding database...');

  // ─── Users ──────────────────────────────
  const adminPassword = await bcrypt.hash('secret', SALT_ROUNDS);
  const guestPassword = await bcrypt.hash('secret', SALT_ROUNDS);

  const existingAdmin = db.select().from(users).where(eq(users.username, 'admin')).get();
  if (!existingAdmin) {
    db.insert(users)
      .values({
        username: 'admin',
        email: 'admin@languagechallenger.com',
        passwordHash: adminPassword,
        displayName: 'Admin',
        isAdmin: true,
        isGuest: false,
      })
      .run();
    console.log('  ✅ Admin user created');
  } else {
    console.log('  ⏭️  Admin user already exists');
  }

  const existingGuest = db.select().from(users).where(eq(users.username, 'guest')).get();
  if (!existingGuest) {
    db.insert(users)
      .values({
        username: 'guest',
        email: 'guest@languagechallenger.com',
        passwordHash: guestPassword,
        displayName: 'Guest',
        isAdmin: false,
        isGuest: true,
      })
      .run();
    console.log('  ✅ Guest user created');
  } else {
    console.log('  ⏭️  Guest user already exists');
  }

  // ─── Initialize user stats ──────────────
  const allUsers = db.select().from(users).all();
  for (const user of allUsers) {
    const existingStats = db.select().from(userStats).where(eq(userStats.userId, user.id)).get();
    if (!existingStats) {
      db.insert(userStats)
        .values({
          userId: user.id,
          executions: 0,
          correct: 0,
          incorrect: 0,
        })
        .run();
    }
  }

  // ─── Sample resources (dev only) ────────
  if (process.env.NODE_ENV !== 'production') {
    const existingResources = db.select().from(resources).all();
    if (existingResources.length === 0) {
      console.log('  📦 Creating sample resources...');

      const samplePhrases = [
        { es: '¿Cómo estás?', en: 'How are you?', tags: ['greetings', 'basic'] },
        { es: '¿Dónde está el baño?', en: 'Where is the bathroom?', tags: ['basic', 'travel'] },
        { es: 'Me gustaría un café', en: "I'd like a coffee", tags: ['food', 'basic'] },
        { es: 'No entiendo', en: "I don't understand", tags: ['basic', 'communication'] },
        { es: '¿Cuánto cuesta?', en: 'How much does it cost?', tags: ['shopping', 'basic'] },
        { es: 'La cuenta, por favor', en: 'The check, please', tags: ['restaurant', 'basic'] },
        {
          es: '¿Puedes hablar más despacio?',
          en: 'Can you speak more slowly?',
          tags: ['communication', 'basic'],
        },
        { es: 'Estoy perdido', en: "I'm lost", tags: ['travel', 'emergency'] },
        { es: '¿Qué hora es?', en: 'What time is it?', tags: ['basic', 'time'] },
        { es: 'Mucho gusto', en: 'Nice to meet you', tags: ['greetings', 'formal'] },
        {
          es: 'Hace buen tiempo hoy',
          en: 'The weather is nice today',
          tags: ['weather', 'small-talk'],
        },
        { es: 'Necesito ayuda', en: 'I need help', tags: ['emergency', 'basic'] },
        { es: '¿Cómo te llamas?', en: 'What is your name?', tags: ['greetings', 'basic'] },
        { es: 'Estoy aprendiendo inglés', en: "I'm learning English", tags: ['education', 'self'] },
        { es: 'Me duele la cabeza', en: 'I have a headache', tags: ['health', 'body'] },
        {
          es: '¿Podemos ir al parque?',
          en: 'Can we go to the park?',
          tags: ['leisure', 'questions'],
        },
        { es: 'Trabajo desde casa', en: 'I work from home', tags: ['work', 'modern'] },
        { es: 'Me encanta la música', en: 'I love music', tags: ['hobbies', 'entertainment'] },
        { es: '¿Tienes hermanos?', en: 'Do you have siblings?', tags: ['family', 'questions'] },
        { es: 'Voy al gimnasio', en: "I'm going to the gym", tags: ['fitness', 'daily'] },
      ];

      const sampleVocabulary = [
        { es: 'Perro', en: 'Dog', tags: ['animals', 'basic'] },
        { es: 'Gato', en: 'Cat', tags: ['animals', 'basic'] },
        { es: 'Casa', en: 'House', tags: ['places', 'basic'] },
        { es: 'Libro', en: 'Book', tags: ['objects', 'education'] },
        { es: 'Mesa', en: 'Table', tags: ['furniture', 'home'] },
        { es: 'Agua', en: 'Water', tags: ['food', 'basic'] },
        { es: 'Sol', en: 'Sun', tags: ['nature', 'weather'] },
        { es: 'Luna', en: 'Moon', tags: ['nature', 'space'] },
        { es: 'Árbol', en: 'Tree', tags: ['nature', 'plants'] },
        { es: 'Flor', en: 'Flower', tags: ['nature', 'plants'] },
        { es: 'Coche', en: 'Car', tags: ['transport', 'modern'] },
        { es: 'Avión', en: 'Airplane', tags: ['transport', 'travel'] },
        { es: 'Ordenador', en: 'Computer', tags: ['technology', 'work'] },
        { es: 'Teléfono', en: 'Phone', tags: ['technology', 'communication'] },
        { es: 'Ventana', en: 'Window', tags: ['home', 'building'] },
      ];

      const sampleParagraphs = [
        {
          es: 'Todos los días me levanto temprano y desayuno antes de ir a trabajar.',
          en: 'Every day I wake up early and have breakfast before going to work.',
          tags: ['daily-routine', 'intermediate'],
        },
        {
          es: 'El fin de semana pasado fui al cine con mis amigos y vimos una película muy buena.',
          en: 'Last weekend I went to the cinema with my friends and we watched a very good movie.',
          tags: ['leisure', 'past-tense', 'intermediate'],
        },
        {
          es: 'Me gustaría viajar a Londres el próximo verano para practicar mi inglés.',
          en: 'I would like to travel to London next summer to practice my English.',
          tags: ['travel', 'conditional', 'intermediate'],
        },
        {
          es: 'Si tuviera más tiempo, aprendería a tocar la guitarra.',
          en: 'If I had more time, I would learn to play the guitar.',
          tags: ['conditional', 'hobbies', 'advanced'],
        },
        {
          es: 'La tecnología ha cambiado la forma en que nos comunicamos con los demás.',
          en: 'Technology has changed the way we communicate with others.',
          tags: ['technology', 'present-perfect', 'advanced'],
        },
      ];

      const allSamples = [
        ...samplePhrases.map((s, i) => ({
          code: `PH-${String(i + 1).padStart(4, '0')}`,
          type: 'phrase' as const,
          ...s,
        })),
        ...sampleVocabulary.map((s, i) => ({
          code: `VC-${String(i + 1).padStart(4, '0')}`,
          type: 'vocabulary' as const,
          ...s,
        })),
        ...sampleParagraphs.map((s, i) => ({
          code: `PR-${String(i + 1).padStart(4, '0')}`,
          type: 'paragraph' as const,
          ...s,
        })),
      ];

      const insertedResources: { id: string; code: string; tags: string[] }[] = [];

      for (const sample of allSamples) {
        const result = db
          .insert(resources)
          .values({
            code: sample.code,
            type: sample.type,
            tags: sample.tags,
            contentEs: sample.es,
            contentEn: sample.en,
          })
          .returning()
          .get();
        insertedResources.push({ id: result.id, code: result.code, tags: result.tags ?? [] });
      }

      console.log(`  ✅ Created ${insertedResources.length} sample resources`);

      // ─── Sample lists ──────────────────
      console.log('  📋 Creating sample lists...');

      const phraseResources = insertedResources.filter((r) => r.code.startsWith('PH-'));
      const vocabResources = insertedResources.filter((r) => r.code.startsWith('VC-'));
      const paragraphResources = insertedResources.filter((r) => r.code.startsWith('PR-'));

      const sampleLists = [
        {
          name: 'Basic Greetings',
          tags: ['greetings', 'basic'],
          resources: phraseResources.slice(0, 5),
        },
        {
          name: 'Travel Essentials',
          tags: ['travel', 'basic'],
          resources: phraseResources.slice(5, 10),
        },
        {
          name: 'Daily Life Phrases',
          tags: ['daily', 'intermediate'],
          resources: phraseResources.slice(10, 20),
        },
        {
          name: 'Basic Vocabulary',
          tags: ['vocabulary', 'basic'],
          resources: vocabResources.slice(0, 8),
        },
        {
          name: 'Nature & Environment',
          tags: ['nature', 'vocabulary'],
          resources: vocabResources.slice(7, 15),
        },
        {
          name: 'Reading Practice',
          tags: ['reading', 'paragraphs'],
          resources: paragraphResources,
        },
        {
          name: 'Mixed Practice',
          tags: ['mixed', 'all-types'],
          resources: [
            ...phraseResources.slice(0, 3),
            ...vocabResources.slice(0, 3),
            ...paragraphResources.slice(0, 2),
          ],
        },
      ];

      for (const listData of sampleLists) {
        const list = db
          .insert(lists)
          .values({
            name: listData.name,
            tags: listData.tags,
          })
          .returning()
          .get();

        for (let i = 0; i < listData.resources.length; i++) {
          db.insert(listResources)
            .values({
              listId: list.id,
              resourceId: listData.resources[i].id,
              position: i,
            })
            .run();
        }
      }

      console.log(`  ✅ Created ${sampleLists.length} sample lists`);
    } else {
      console.log('  ⏭️  Resources already exist, skipping sample data');
    }
  }

  console.log('🌱 Seeding complete!');
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
