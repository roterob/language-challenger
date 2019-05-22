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
  options: ['2 hours ago', 'yesterday', 'last monday'],
  filter: v => ({
    createdAt: {
      $gte: stringToDate(v),
    },
  }),
};

export default tags => {
  const fields = [typeField, fromField];
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
