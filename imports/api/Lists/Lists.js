import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

const Lists = new Mongo.Collection('Lists');

Lists.allow({
  insert: () => false,
  update: () => false,
  remove: () => false,
});

Lists.deny({
  insert: () => true,
  update: () => true,
  remove: () => true,
});

Lists.schema = new SimpleSchema({
  name: { type: String },
  tags: { type: Array },
  'tags.$': { type: String },
  resources: { type: Array },
  'resources.$': { type: String },
});

Lists.attachSchema(Lists.schema);

export default Lists;
