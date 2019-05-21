import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

const UserStats = new Mongo.Collection('UserStats');

UserStats.allow({
  insert: () => false,
  update: () => false,
  remove: () => false,
});

UserStats.deny({
  insert: () => true,
  update: () => true,
  remove: () => true,
});

UserStats.schema = new SimpleSchema({
  userId: { type: String, required: true },
  executions: { type: Number, required: true },
  correct: { type: Number, required: true },
  incorrect: { type: Number, required: true },
});

UserStats.attachSchema(UserStats.schema);

export default UserStats;
