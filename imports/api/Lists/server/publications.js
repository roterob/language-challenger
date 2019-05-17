import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import Lists from '../Lists';
import ListStats from '../ListStats';
import ListsExecutions from '../ListsExecutions';
import Resources from '../../Resources/Resources';

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

Meteor.publish('listExecution', function listExecution(id) {
  check(id, String);

  const userId = Meteor.userId();

  const executionCursor = ListsExecutions.find({ _id: id, userId });

  const resourceIds = [];
  executionCursor.forEach(e =>
    resourceIds.push(...e.results.map(r => r.resourceId)),
  );
  const resourcesCursor = Resources.find({ _id: { $in: resourceIds } });

  return [executionCursor, resourcesCursor];
});
