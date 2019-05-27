import { Meteor } from 'meteor/meteor';
import SimpleSchema from 'simpl-schema';

const Tasks = new Meteor.Collection('Tasks');

Tasks.allow({
  insert: () => false,
  update: () => false,
  remove: () => false,
});

Tasks.deny({
  insert: () => true,
  update: () => true,
  remove: () => true,
});

Tasks.schema = new SimpleSchema({
  fileId: { type: String },
  fileName: { type: String },
  status: {
    type: String,
    allowedValues: ['inProgress', 'finished', 'aborted'],
  },
  current: { type: Number },
  total: { type: Number },
  error: { type: String, required: false },
  createdAt: { type: Date },
  updatedAt: { type: Date, required: false },
  finishedAt: { type: Date, required: false },
});

Tasks.attachSchema(Tasks.schema);

export default Tasks;
