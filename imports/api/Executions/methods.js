import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import Lists from '../Lists/Lists';
import Executions from './Executions';
import ListStats from '../Lists/ListStats';
import UserStats from '../Users/UserStats';
import ResourceStats from '../Resources/ResourceStats';
import handleMethodException from '../../modules/handle-method-exception';

Meteor.methods({
  'executions.start': function listsStartExecution(listId) {
    check(listId, Match.OneOf(String, [String]));
    const userId = Meteor.userId();

    if (Meteor.isClient) {
      return;
    }

    let listIds = listId instanceof Array ? listId : [listId];

    try {
      let execution = Executions.findOne({
        listId: listIds,
        userId,
        inProgress: true,
      });
      if (!execution) {
        const lists = Lists.find({ _id: { $in: listIds } }).fetch();
        execution = {
          userId,
          listId: listIds,
          name: lists.map(l => l.name).join(' & '),
          tags: _.chain(lists)
            .map(l => l.tags)
            .flatten()
            .uniq()
            .value(),
          inProgress: true,
          results: _.chain(lists)
            .map(l =>
              l.resources.map(r => ({
                resourceId: r,
                result: null,
                listId: l._id,
              })),
            )
            .flatten()
            .value(),
          currentIndex: 0,
          createdAt: new Date().getTime(),
          updatedAt: new Date().getTime(),
          numLoopExecutions: 0,
          counts: { correct: 0, incorrect: 0, noexecuted: 0 },
        };

        execution._id = Executions.insert(execution);
      }
      return execution._id;
    } catch (exception) {
      handleMethodException(exception);
    }
  },
  'executions.startTemp': function listsStartExecution(list) {
    check(list, { name: String, tags: [String], resources: [String] });
    const userId = Meteor.userId();

    try {
      const execution = {
        userId,
        name: list.name,
        tags: list.tags,
        inProgress: true,
        results: list.resources.map(r => ({ resourceId: r, result: null })),
        currentIndex: 0,
        createdAt: new Date().getTime(),
        updatedAt: new Date().getTime(),
        counts: { correct: 0, incorrect: 0, noexecuted: 0 },
      };
      return Executions.insert(execution);
    } catch (exception) {
      handleMethodException(exception);
    }
  },
  'executions.saveConfig': function executionsSaveconfig(executionId, config) {
    check(executionId, String);
    check(config, Object);
    const userId = Meteor.userId();

    const execution = Executions.findOne({ _id: executionId, userId });
    let { results, config: currentConfig } = execution;

    if (!currentConfig && config.shuffle) {
      results = _.shuffle(results);
    }

    try {
      Executions.update(
        { _id: executionId, inProgress: true, userId },
        { $set: { config, results } },
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
    check(currentIndex, Number);
    check(result, {
      resourceId: String,
      result: Match.OneOf(Boolean, null),
      listId: Match.Optional(Match.OneOf(String, undefined)),
    });
    const userId = Meteor.userId();
    const updatedAt = new Date().getTime();

    try {
      Executions.update(
        {
          _id: executionId,
          inProgress: true,
          userId,
          'results.resourceId': result.resourceId,
          'results.listId': result.listId,
        },
        {
          $set: { 'results.$.result': result.result, currentIndex, updatedAt },
        },
      );
      if (Meteor.isServer && result.result != null) {
        updateResourceStats(userId, result.resourceId, result.result);
      }
    } catch (exception) {
      handleMethodException(exception);
    }
  },
  'executions.restart': function executionRestart(executionId) {
    check(executionId, String);

    try {
      const execution = Executions.findOne(executionId);
      const numLoopExecutions = (execution.numLoopExecutions || 1) + 1;
      const userId = Meteor.userId();
      const currentIndex = 0;
      const updatedAt = new Date().getTime();

      Executions.update(
        {
          _id: executionId,
          inProgress: true,
          userId,
        },
        {
          $set: { numLoopExecutions, currentIndex, updatedAt },
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
      const execution = Executions.findOne(executionId);
      const { listId } = execution;

      // Updating counters
      const counts = {};
      execution.results.forEach(r => {
        const listCounts = counts[r.listId || 'tempList'] || {
          correct: 0,
          incorrect: 0,
          noexecuted: 0,
        };
        if (r.result == null) {
          listCounts.noexecuted += 1;
        } else if (r.result) {
          listCounts.correct += 1;
        } else {
          listCounts.incorrect += 1;
        }
        counts[r.listId] = listCounts;
      });

      const totalCounts = { correct: 0, incorrect: 0, noexecuted: 0 };

      Object.values(counts).forEach(c => {
        totalCounts.correct += c.correct;
        totalCounts.incorrect += c.incorrect;
        totalCounts.noexecuted += c.noexecuted;
      });

      if (Meteor.isServer) {
        if (listId) {
          listId.forEach(id => {
            updateListStats(userId, id, counts[id]);
          });
        }
        updateUserStats(userId, totalCounts);
      }

      Executions.update(
        { _id: executionId, inProgress: true, userId },
        {
          $set: { inProgress: false, updateAt, counts: totalCounts, currentIndex: 0 },
        },
      );
    } catch (exception) {
      handleMethodException(exception);
    }
  },
});

function updateResourceStats(userId, resourceId, result) {
  let resourceStats = ResourceStats.findOne({ userId, resourceId });

  if (!resourceStats) {
    resourceStats = {
      userId,
      resourceId,
      executions: 0,
      correct: 0,
      incorrect: 0,
    };
  }

  resourceStats.executions += 1;
  resourceStats.lastExec = new Date();
  resourceStats.lastResult = result;
  if (result) {
    resourceStats.correct += 1;
  } else {
    resourceStats.incorrect += 1;
  }

  ResourceStats.update(
    { userId, resourceId },
    { $set: resourceStats },
    { upsert: true },
  );
}

function updateListStats(userId, listId, { correct, incorrect }) {
  let listStats = ListStats.findOne({ userId, listId });

  if (!listStats) {
    listStats = {
      userId,
      listId: listId,
      executions: 0,
      correct: 0,
      incorrect: 0,
    };
  }

  listStats.executions += 1;
  listStats.correct += correct;
  listStats.incorrect += incorrect;

  ListStats.update({ userId, listId }, { $set: listStats }, { upsert: true });
}

function updateUserStats(userId, { correct, incorrect }) {
  let userStats = UserStats.findOne({ userId });

  if (!userStats) {
    userStats = {
      executions: 0,
      correct: 0,
      incorrect: 0,
    };
  }

  userStats.executions += 1;
  userStats.correct += correct;
  userStats.incorrect += incorrect;

  UserStats.update({ userId }, { $set: userStats }, { upsert: true });
}
