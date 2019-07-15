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
  userId: { type: String },
  listId: { type: String, optional: true },
  name: { type: String },
  tags: { type: Array },
  'tags.$': { type: String },
  inProgress: { type: Boolean },
  numLoopExecutions: { type: Number, defaultValue: 0 },
  results: { type: Array },
  'results.$': { type: Object },
  'results.$.resourceId': { type: String },
  'results.$.result': { type: Boolean, optional: true },
  config: { type: Object, optional: true },
  'config.questionLang': { type: String, allowedValues: ['en', 'es'] },
  'config.playQuestion': { type: Boolean },
  'config.playAnswer': { type: Boolean },
  'config.writeAnswer': { type: Boolean },
  'config.automaticMode': { type: Boolean },
  'config.loopMode': { type: Boolean, defaultValue: false },
  'config.shuffle': { type: Boolean, defaultValue: false },
  currentIndex: { type: Number },
  createdAt: { type: Date },
  updatedAt: { type: Date },
  counts: { type: Object },
  'counts.correct': { type: Number },
  'counts.incorrect': { type: Number },
  'counts.noexecuted': { type: Number },
});

Executions.attachSchema(Executions.schema);
export default Executions;
