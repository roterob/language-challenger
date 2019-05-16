import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

const Resources = new Mongo.Collection('Resources');

Resources.allow({
  insert: () => false,
  update: () => false,
  remove: () => false,
});

Resources.deny({
  insert: () => true,
  update: () => true,
  remove: () => true,
});

Resources.schema = new SimpleSchema({
  type: { type: String, allowedValues: ['phrase', 'vocabulary', 'paragraph'] },
  tags: { type: Array },
  'tags.$': { type: String },
  info: { type: Object },
  'info.es': { type: Object },
  'info.es.text': { type: String },
  'info.es.audio': { type: String },
  'info.en': { type: Object },
  'info.en.text': { type: String },
  'info.en.audio': { type: String },
});

Resources.attachSchema(Resources.schema);

export default Resources;
