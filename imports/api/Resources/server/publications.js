import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check, Match } from 'meteor/check';
import Resources from '../Resources';
import ResourceStatsView from '../ResourceStatsView';

import settings from '../../../../defaultSettings';

const { maxElementsResult } = settings;

Meteor.publish('resources', function users(filters, fields) {
  check(fields, Match.Maybe(Object));
  check(filters, Match.Maybe(Object));

  return Resources.find(filters || {}, {
    fields: fields || {},
    limit: maxElementsResult + 1,
  });
});

Meteor.publish('resourcesStats', function users(filters, fields) {
  check(fields, Match.Maybe(Object));
  check(filters, Match.Maybe(Object));

  // Working with Views this is important disableOplog=true
  // https://github.com/meteor/meteor/issues/8682
  return ResourceStatsView.find(
    { ...(filters || {}), userId: Meteor.userId() },
    {
      fields: fields || {},
      limit: maxElementsResult + 1,
      disableOplog: true,
    },
  );
});
