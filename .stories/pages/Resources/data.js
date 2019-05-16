module.exports = [
  {
    _id: '1',
    type: 'vocabulary',
    tags: ['uno', 'dos', 'tres'],
    info: {
      es: { text: 'es text', audio: 'es audio' },
      en: { text: 'en text', audio: 'en audio' },
    },
  },
  {
    _id: '2',
    type: 'phrase',
    tags: ['uno', 'tres'],
    info: {
      es: { text: 'es text', audio: 'es audio' },
      en: { text: 'en text', audio: 'en audio' },
    },
  },
  {
    _id: '3',
    type: 'paragraph',
    tags: ['uno', 'dos'],
    info: {
      es: { text: 'es text', audio: 'es audio' },
      en: { text: 'en text', audio: 'en audio' },
    },
  },
];
