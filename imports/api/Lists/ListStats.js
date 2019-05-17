import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

const ListStats = new Mongo.Collection('ListStats');

ListStats.allow({
  insert: () => false,
  update: () => false,
  remove: () => false,
});

ListStats.deny({
  insert: () => true,
  update: () => true,
  remove: () => true,
});

ListStats.schema = new SimpleSchema({
  userId: { type: String, required: true },
  listId: { type: String, required: true },
  executions: { type: Number, required: true },
  correct: { type: Number, required: true },
  incorrect: { type: Number, required: true },
});

ListStats.attachSchema(ListStats.schema);

export default ListStats;
