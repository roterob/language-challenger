import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';

import ExecutionsCollection from '../../../api/Executions/Executions';
import ResourcesCollection from '../../../api/Resources/Resources';
import ResourceStatsCollection from '../../../api/Resources/ResourceStats';

import ListExecution from './ListExecution';
import dispatch from '../../../modules/dispatch';

export default withTracker(({ executionId, onClose }) => {
  const subscription = Meteor.subscribe('execution', executionId);

  let listExecution = {};
  let resources = [];
  let resourcesStats = [];
  let fetchTimestamp = null;

  if (subscription.ready()) {
    listExecution = ExecutionsCollection.findOne({ _id: executionId });
    resources = ResourcesCollection.find().fetch();
    resourcesStats = ResourceStatsCollection.find().fetch();
    fetchTimestamp = new Date().getTime();
  }

  return {
    isLoading: !subscription.ready(),
    fetchTimestamp,
    listExecution,
    resourcesStats,
    resources,
    dispatch,
    onClose,
  };
})(ListExecution);
