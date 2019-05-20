import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import Executions from '../Executions';
import Resources from '../../Resources/Resources';

import settings from '../../../../defaultSettings';

const { maxElementsResult } = settings;

Meteor.publish('execution', function listExecution(id) {
  check(id, String);

  const userId = Meteor.userId();

  const executionCursor = Executions.find({ _id: id, userId });

  const resourceIds = [];
  executionCursor.forEach(e =>
    resourceIds.push(...e.results.map(r => r.resourceId)),
  );
  const resourcesCursor = Resources.find({ _id: { $in: resourceIds } });

  return [executionCursor, resourcesCursor];
});
