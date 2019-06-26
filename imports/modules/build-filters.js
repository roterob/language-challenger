import { stringToDate } from './date-helpers';

export const typeField = {
  name: 'type',
  type: 'select',
  options: ['phrase', 'vocabulary', 'paragraph'],
  filter: v => ({
    type: v,
  }),
};

export const fromField = {
  name: 'from',
  type: 'date',
  options: ['2 hours ago', 'yesterday', 'last month'],
  filter: v => ({
    createdAt: {
      $gte: stringToDate(v),
    },
  }),
};

export const automaticField = {
  name: 'automatic',
  type: 'select',
  options: ['yes', 'no'],
  filter: v => ({
    'config.automaticMode': v == 'yes',
  }),
};

export const favouriteField = {
  name: 'favourite',
  type: 'select',
  options: ['yes', 'no'],
  filter: v => {
    if (v == 'yes') {
      return { isFavourite: true };
    } else {
      return {
        $or: [{ isFavourite: { $exists: false } }, { isFavourite: false }],
      };
    }
  },
};

export const lastResult = {
  name: 'result',
  type: 'select',
  options: ['failed', 'correct'],
  filter: v => ({ lastResult: v === 'correct' }),
};

export const execStateField = {
  name: 'state',
  type: 'select',
  options: ['in progress', 'finished'],
  filter: v => ({
    inProgress: v === 'in progress',
  }),
};

export default tags => {
  const fields = [
    typeField,
    fromField,
    execStateField,
    automaticField,
    favouriteField,
    lastResult,
  ];
  const normalTags = [];
  let res = {};

  if (tags) {
    tags.forEach(t => {
      if (t.indexOf(':') > 0) {
        const [name, value] = t.split(':');
        const field = fields.find(f => f.name == name);
        const filter = field.filter(value);

        res = { ...res, ...filter };
      } else {
        normalTags.push(t);
      }
    });
  }

  if (normalTags.length > 0) {
    res.tags = { $all: normalTags };
  }

  return res;
};
