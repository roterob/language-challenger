import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import Users from './Users';
import handleMethodException from '../../modules/handle-method-exception';

Meteor.methods({
  'users.updateUISettings': function usersUpdateUISettings(uiSettings) {
    check(uiSettings, Object);

    try {
      Users.update(Meteor.userId(), { $set: { uiSettings } });
    } catch (exception) {
      handleMethodException(exception);
    }
  },
  'users.logout': function usersUpdateUISettings() {
    try {
      Meteor.logout();
    } catch (exception) {
      handleMethodException(exception);
    }
  },
});
