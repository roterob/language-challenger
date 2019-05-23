import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';
import { Meteor } from 'meteor/meteor';

const ResourceStats = new Mongo.Collection('ResourceStats');

ResourceStats.allow({
  insert: () => false,
  update: () => false,
  remove: () => false,
});

ResourceStats.deny({
  insert: () => true,
  update: () => true,
  remove: () => true,
});

ResourceStats.schema = new SimpleSchema({
  userId: { type: String, required: true },
  resourceId: { type: String, required: true },
  executions: { type: Number, required: true },
  correct: { type: Number, required: true },
  incorrect: { type: Number, required: true },
  lastExec: { type: Date, required: true },
  isFavourite: { type: Boolean, required: false },
});

ResourceStats.buildDefault = function(initObj) {
  return {
    ...{
      executions: 0,
      correct: 0,
      incorrect: 0,
      lastExec: new Date(),
      isFavourite: false,
    },
    ...initObj,
  };
};

ResourceStats.attachSchema(ResourceStats.schema);

export default ResourceStats;
