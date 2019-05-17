import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

const ListsExecutions = new Mongo.Collection('ListsExecutions');

ListsExecutions.allow({
  insert: () => false,
  update: () => false,
  remove: () => false,
});

ListsExecutions.deny({
  insert: () => true,
  update: () => true,
  remove: () => true,
});

ListsExecutions.schema = new SimpleSchema({
  userId: { type: String, required: true },
  listId: { type: String, required: true },
  inProgress: { type: Boolean, required: true },
  results: { type: Array, required: true },
  'results.$': { type: Object },
  'results.$.resourceId': { type: String, required: true },
  'results.$.result': { type: Boolean },
  createdAt: { type: Date, required: true },
  updatedAt: { type: Date, required: true },
});

ListsExecutions.attachSchema(ListsExecutions.schema);
export default ListsExecutions;
