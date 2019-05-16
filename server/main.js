import { Meteor } from 'meteor/meteor';
import { Migrations } from 'meteor/percolate:migrations';

import '../imports/startup/server';

Meteor.startup(() => {
  Migrations.migrateTo('latest');
});
