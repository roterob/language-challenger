import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

const Executions = new Mongo.Collection('Executions');

Executions.allow({
  insert: () => false,
  update: () => false,
  remove: () => false,
});

Executions.deny({
  insert: () => true,
  update: () => true,
  remove: () => true,
});

Executions.schema = new SimpleSchema({
  userId: { type: String, required: true },
  listId: { type: String, required: true },
  name: { type: String, required: true },
  tags: { type: Array, required: true },
  'tags.$': { type: String },
  inProgress: { type: Boolean, required: true },
  results: { type: Array, required: true },
  'results.$': { type: Object },
  'results.$.resourceId': { type: String, required: true },
  'results.$.result': { type: Boolean, required: false },
  config: { type: Object, required: false },
  'config.questionLang': { type: String, allowedValues: ['en', 'es'] },
  'config.playQuestion': { type: Boolean, required: true },
  'config.playAnswer': { type: Boolean, required: true },
  currentIndex: { type: Number, required: true },
  createdAt: { type: Date, required: true },
  updatedAt: { type: Date, required: true },
  counts: { type: Object, required: true },
  'counts.correct': { type: Number },
  'counts.incorrect': { type: Number },
});

Executions.attachSchema(Executions.schema);
export default Executions;
