import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import Resources from '../Resources';

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
