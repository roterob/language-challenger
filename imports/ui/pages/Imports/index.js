import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';

import TasksCollection from '../../../api/Imports/Tasks';
import ImportsCollection from '../../../api/Imports/Imports';
import ImportsPage from './Imports';

const getUploadHandler = file => {
  return ImportsCollection.insert(
    {
      file,
      streams: 'dynamic',
      chunkSize: 'dynamic',
    },
    false,
  );
};

let currentTask = {};
export default withTracker(() => {
  const subscription = Meteor.subscribe('activeTasks');

  if (subscription.ready()) {
    currentTask = TasksCollection.findOne({ status: 'inProgress' });
  }

  return {
    isLoading: !subscription.ready(),
    onFileSelected: getUploadHandler,
    task: currentTask,
  };
})(ImportsPage);
