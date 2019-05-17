import { Meteor } from 'meteor/meteor';

if (Meteor.isDevelopment) {
  import createResources from './createResources';
  import createLists from './createLists';

  const runFixtures = function() {
    createResources();
    createLists();
  };

  runFixtures();
}
