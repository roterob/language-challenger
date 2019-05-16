export const listExecution = {
  _id: '1',
  listId: '2',
  inProgres: true,
  results: [
    {
      resourceId: '1',
      result: null,
    },
    {
      resourceId: '2',
      result: null,
    },
    {
      resourceId: '3',
      result: null,
    },
  ],
  userId: '1',
  createdAt: new Date(),
};
export const listExecutionFinished = {
  _id: '1',
  listId: '2',
  inProgres: false,
  results: [
    {
      resourceId: '1',
      result: true,
    },
    {
      resourceId: '2',
      result: false,
    },
    {
      resourceId: '3',
      result: true,
    },
  ],
  userId: '1',
  createdAt: new Date(),
};
export const resources = [
  {
    _id: '1',
    type: 'vocabulary',
    tags: ['uno', 'dos', 'tres'],
    info: {
      es: { text: 'es text 1', audio: 'es audio' },
      en: { text: 'en text 1', audio: 'en audio' },
    },
  },
  {
    _id: '2',
    type: 'phrase',
    tags: ['uno', 'tres'],
    info: {
      es: { text: 'es text 2', audio: 'es audio' },
      en: { text: 'en text 2', audio: 'en audio' },
    },
  },
  {
    _id: '3',
    type: 'paragraph',
    tags: ['uno', 'dos'],
    info: {
      es: { text: 'es text 3', audio: 'es audio' },
      en: { text: 'en text 3', audio: 'en audio' },
    },
  },
];
