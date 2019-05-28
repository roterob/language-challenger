import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import Lists from './Lists';
import handleMethodException from '../../modules/handle-method-exception';
import { List } from 'antd';

Meteor.methods({
  'lists.save': function listsSave(list) {
    try {
      // TODO: Your code goes here
      Lists.insert(list);
    } catch (exception) {
      handleMethodException(exception);
    }
  },
});
