import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import Lists from '../Lists/Lists';
import Executions from './Executions';
import ListStats from '../Lists/ListStats';
import handleMethodException from '../../modules/handle-method-exception';
import { exec } from 'child_process';

Meteor.methods({
  'executions.start': function listsStartExecution(listId) {
    check(listId, String);
    const userId = Meteor.userId();

    try {
      let execution = Executions.findOne({ listId, userId, inProgress: true });
      if (!execution) {
        const list = Lists.findOne(listId);
        execution = {
          userId,
          listId,
          inProgress: true,
          results: list.resources.map(r => ({ resourceId: r, result: null })),
          currentIndex: 0,
          createdAt: new Date().getTime(),
          updatedAt: new Date().getTime(),
        };

        execution._id = Executions.insert(execution);
      }
      return execution._id;
    } catch (exception) {
      handleMethodException(exception);
    }
  },
  'executions.saveConfig': function executionsSaveconfig(executionId, config) {
    check(executionId, String);
    check(config, Object);
    const userId = Meteor.userId();

    try {
      Executions.update(
        { _id: executionId, inProgress: true, userId },
        { $set: { config } },
      );
    } catch (exception) {
      handleMethodException(exception);
    }
  },
  'executions.saveResult': function executionsSaveResult(
    executionId,
    currentIndex,
    result,
  ) {
    check(executionId, String);
    check(result, { resourceId: String, result: Boolean });
    const userId = Meteor.userId();
    updatedAt = new Date().getTime();

    try {
      Executions.update(
        {
          _id: executionId,
          inProgress: true,
          userId,
          'results.resourceId': result.resourceId,
        },
        {
          $set: { 'results.$.result': result.result, currentIndex, updatedAt },
        },
      );
    } catch (exception) {
      handleMethodException(exception);
    }
  },
  'executions.finish': function executionsFinish(executionId) {
    check(executionId, String);
    const userId = Meteor.userId();
    const updateAt = new Date().getTime();

    try {
      if (Meteor.isServer) {
        const execution = Executions.findOne(executionId);
        let stats = ListStats.findOne({ userId, listId: execution.listId });

        if (!stats) {
          stats = {
            userId,
            listId: execution.listId,
            executions: 0,
            correct: 0,
            incorrect: 0,
          };
        }

        // Updating counters
        stats.executions += 1;
        execution.results.forEach(r => {
          if (r.result) {
            stats.correct += 1;
          } else {
            stats.incorrect += 1;
          }
        });

        // Setting
        ListStats.update(
          { userId, listId: execution.listId },
          { $set: stats },
          { upsert: true },
        );
      }

      Executions.update(
        { _id: executionId, inProgress: true, userId },
        {
          $set: { inProgress: false, updateAt },
        },
      );
    } catch (exception) {
      handleMethodException(exception);
    }
  },
});
