import Resources from '../api/Resources/Resources';
import { Meteor } from 'meteor/meteor';

if (Meteor.isDevelopment) {
  import createResources from './createResources';

  const runFixtures = function() {
    const shouldCreateResources = Resources.find().count() < 200;

    if (shouldCreateResources) {
      createResources();
    }
  };

  runFixtures();
}
