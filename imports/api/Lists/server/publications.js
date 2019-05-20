import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import Lists from '../Lists';
import ListStats from '../ListStats';

import settings from '../../../../defaultSettings';

const { maxElementsResult } = settings;

Meteor.publish('lists', function lists(filters, fields) {
  check(fields, Match.Maybe(Object));
  check(filters, Match.Maybe(Object));

  const userId = Meteor.userId();

  const listsCursor = Lists.find(filters || {}, {
    fields: fields || {},
    limit: maxElementsResult + 1,
  });

  const listIds = listsCursor.map(l => l._id);
  const statsCursor = ListStats.find({ listId: { $in: listIds }, userId });

  return [listsCursor, statsCursor];
});
