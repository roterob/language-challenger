import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import Lists from './Lists';
import handleMethodException from '../../modules/handle-method-exception';

Meteor.methods({
  'lists.save': function listsSave() {
    try {
      // TODO: Your code goes here
      throw new Meteor.Error(
        'method-not-implemented',
        'list.save is not implemented',
      );
    } catch (exception) {
      handleMethodException(exception);
    }
  },
});
