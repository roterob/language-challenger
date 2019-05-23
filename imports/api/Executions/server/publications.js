import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import Executions from '../Executions';
import Resources from '../../Resources/Resources';
import ResourceStats from '../../Resources/ResourceStats';

import settings from '../../../../defaultSettings';

const { maxElementsResult } = settings;

Meteor.publish('executions', function executions(f) {
  const filters = f || {};
  filters.userId = Meteor.userId();

  return Executions.find(filters, {
    limit: maxElementsResult + 1,
    sort: { updatedAt: -1 },
  });
});

Meteor.publish('execution', function execution(id) {
  check(id, String);

  const userId = Meteor.userId();

  const executionCursor = Executions.find({ _id: id, userId });

  const resourceIds = [];
  executionCursor.forEach(e =>
    resourceIds.push(...e.results.map(r => r.resourceId)),
  );
  const resourcesCursor = Resources.find({ _id: { $in: resourceIds } });
  const resourcesStatsCursor = ResourceStats.find({
    userId,
    resourceId: { $in: resourceIds },
  });

  return [executionCursor, resourcesCursor, resourcesStatsCursor];
});
