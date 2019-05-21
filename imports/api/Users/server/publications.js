import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import Users from '../Users';
import UserStats from '../UserStats';

Meteor.publish('users', function users() {
  return Users.find({}, { fields: Users.publicFields });
});

Meteor.publish('user', function user() {
  const fields = Object.assign({}, Users.publicFields, {
    menu: 1,
    uiSettings: 1,
  });

  return Users.find(Meteor.userId(), { fields });
});

Meteor.publish('userStats', function userStats() {
  return UserStats.find({ userId: Meteor.userId() });
});
