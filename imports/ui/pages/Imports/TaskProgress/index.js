import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';

import TasksCollection from '../../../../api/Imports/Tasks';
import TaskProgress from './TaskProgress';

export default withTracker(({ taskId }) => {
  const subscription = Meteor.subscribe('task', taskId);

  let data = {};
  if (subscription.ready()) {
    data = TasksCollection.findOne(taskId);
  }

  return {
    isLoading: !subscription.ready(),
    data,
  };
})(TaskProgress);
