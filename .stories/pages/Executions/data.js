import moment from 'moment';

export const executions = [
  {
    _id: '1',
    userId: '1',
    listId: '1',
    name: 'Booklet1 // List1',
    tags: ['Booklet1', 'List1', 'Phrases', 'Easy'],
    inProgress: true,
    results: [
      {
        resoruceId: 'r1',
        result: null,
      },
      {
        resoruceId: 'r2',
        result: null,
      },
      {
        resoruceId: 'r3',
        result: null,
      },
    ],
    config: null,
    currentIndex: 0,
    createdAt: new Date().getTime(),
    updatedAt: new Date().getTime(),
    counts: {
      correct: 0,
      incorrect: 0,
    },
  },
  {
    _id: '2',
    userId: '1',
    listId: '1',
    name: 'Booklet1 // List2',
    tags: ['Booklet1', 'List2', 'Phrases', 'Easy'],
    inProgress: false,
    results: [
      {
        resoruceId: 'r4',
        result: true,
      },
      {
        resoruceId: 'r5',
        result: true,
      },
    ],
    config: null,
    currentIndex: 0,
    createdAt: new Date().getTime(),
    updatedAt: moment().add(-2, 'hours'),
    counts: {
      correct: 2,
      incorrect: 0,
    },
  },
  {
    _id: '3',
    userId: '1',
    listId: '1',
    name: 'Booklet2 // List4',
    tags: ['Booklet2', 'List1', 'Vocabulary', 'Medium'],
    inProgress: false,
    results: [
      {
        resoruceId: 'r6',
        result: true,
      },
      {
        resoruceId: 'r7',
        result: false,
      },
      {
        resoruceId: 'r8',
        result: false,
      },
      {
        resoruceId: 'r9',
        result: true,
      },
    ],
    config: null,
    currentIndex: 0,
    createdAt: new Date().getTime(),
    updatedAt: moment().add(-25, 'hours'),
    counts: {
      correct: 2,
      incorrect: 2,
    },
  },
  {
    _id: '2',
    userId: '1',
    listId: '1',
    name: 'Booklet1 // List2',
    tags: ['Booklet1', 'List2', 'Phrases', 'Easy'],
    inProgress: false,
    results: [
      {
        resoruceId: 'r4',
        result: true,
      },
      {
        resoruceId: 'r5',
        result: true,
      },
    ],
    config: null,
    currentIndex: 0,
    createdAt: new Date().getTime(),
    updatedAt: moment().add(-3, 'days'),
    counts: {
      correct: 2,
      incorrect: 0,
    },
  },
  {
    _id: '2',
    userId: '1',
    listId: '1',
    name: 'Booklet1 // List2',
    tags: ['Booklet1', 'List2', 'Phrases', 'Easy'],
    inProgress: false,
    results: [
      {
        resoruceId: 'r4',
        result: false,
      },
      {
        resoruceId: 'r5',
        result: false,
      },
    ],
    config: null,
    currentIndex: 0,
    createdAt: new Date().getTime(),
    updatedAt: moment().add(-9, 'days'),
    counts: {
      correct: 0,
      incorrect: 2,
    },
  },
];

export const userStats = {
  userId: '1',
  executions: '2',
  correct: 20,
  incorrect: 30,
};
