import { Meteor } from 'meteor/meteor';
import Lists from './Lists';
import handleMethodException from '../../modules/handle-method-exception';

Meteor.methods({
  'lists.save': function listsSave(list) {
    try {
      if (list._id) {
        Lists.update(list._id, { $set: list });
      } else {
        Lists.insert(list);
      }
    } catch (exception) {
      handleMethodException(exception);
    }
  },
});
