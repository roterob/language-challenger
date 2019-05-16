---
to: imports/api/<%=name%>/server/publications.js
---
import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import <%=name%> from '../<%=name%>';

import settings from '../../../../defaultSettings';

const { maxElementsResult } = settings;

Meteor.publish('<%=name.toLowerCase()%>', function users(filters, fields) {
  check(fields, Match.Maybe(Object));
  check(filters, Match.Maybe(Object));

  return <%=name%>.find(filters || {}, {
    fields: fields || {},
    limit: maxElementsResult + 1,
  });
});
