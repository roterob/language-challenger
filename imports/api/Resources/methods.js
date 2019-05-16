import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import Resources from './Resources';
import handleMethodException from '../../modules/handle-method-exception';

Meteor.methods({
  'resources.collectTags': function resourcesCollectTags() {
    check(resourceType, String);
    check(tags, Array);

    try {
    } catch (exception) {
      handleMethodException(exception);
    }
  },
  'resources.save': function resourcesSave(resource) {
    check(resource, Object);

    try {
      if (resource._id) {
        Resources.update(resource._id, { $set: resource });
      } else {
        Resources.insert(resource);
      }
    } catch (exception) {
      handleMethodException(exception);
    }
  },
});
