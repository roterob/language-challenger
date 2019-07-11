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

    let executionListId = listId;
    let listIds = listId instanceof Array ? listId : [listId];

    executionListId = listIds.join('_');

    try {
      let execution = Executions.findOne({
        listId: executionListId,
        userId,
        inProgress: true,
      });
      if (!execution) {
        const lists = Lists.find({ _id: { $in: listIds } }).fetch();
        execution = {
          userId,
          listId: executionListId,
          name: lists.map(l => l.name).join(' & '),
          tags: _.chain(lists)
            .map(l => l.tags)
            .flatten()
            .uniq()
            .value(),
          inProgress: true,
          results: _.chain(lists)
            .map(l => l.resources)
            .flatten()
            .uniq()
            .map(r => ({ resourceId: r, result: null }))
            .value(),
          currentIndex: 0,
          createdAt: new Date().getTime(),
          updatedAt: new Date().getTime(),
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
    check(result, { resourceId: String, result: Match.OneOf(Boolean, null) });
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
      if (Meteor.isServer && result.result != null) {
        updateResourceStats(userId, result.resourceId, result.result);
      }
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
      const counts = { correct: 0, incorrect: 0, noexecuted: 0 };

      // Updating counters
      execution.results.forEach(r => {
        if (r.result == null) {
          counts.noexecuted += 1;
        } else if (r.result) {
          counts.correct += 1;
        } else {
          counts.incorrect += 1;
        }
      });

      if (Meteor.isServer) {
        updateListStats(userId, listId, counts);
        updateUserStats(userId, counts);
      }

      Executions.update(
        { _id: executionId, inProgress: true, userId },
        {
          $set: { inProgress: false, updateAt, counts, currentIndex: 0 },
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
