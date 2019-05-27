import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import Tasks from '../Tasks';

Meteor.publish('activeTasks', function activeTasks() {
  return Tasks.find({ status: 'inProgress' });
});

Meteor.publish('task', function task(id) {
  check(id, String);
  return Tasks.find(id);
});
