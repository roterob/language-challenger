import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import Resources from './Resources';
import ResourceStats from './ResourceStats';
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
  'resources.toggleFavourite': function toggleFavourite(resourceId) {
    check(resourceId, String);
    const userId = Meteor.userId();

    try {
      const stat = ResourceStats.findOne({ userId, resourceId });
      if (!stat) {
        stat = ResourceStats.buildDefault({ userId, resourceId });
      }
      stat.isFavourite = !stat.isFavourite;
      ResourceStats.update(
        { userId, resourceId },
        { $set: stat },
        { upsert: true },
      );
    } catch (exception) {
      handleMethodException(exception);
    }
  },
});
