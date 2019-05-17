import Meteor from 'meteor/meteor';
import withTracker from 'meteor/react-meteor-data';

import ExecutionsCollection from '../../../api/Lists/ListsExecutions';
import ResourcesCollection from '../../../api/Resources/Resources';

import ListExecution from './ListExecution';
import dispatch from '../../../modules/dispatch';

export default withTracker((executionId, onClose) => {
  const subscription = Meteor.subscribe('listExecution', executionId);

  let listExecution = {};
  let resources = [];
  let fetchTimestamp = null;

  if (subscription.ready()) {
    listExecution = ExecutionsCollection.findOne({ _id: executionId });
    resources = ResourcesCollection.find({});
    fetchTimestamp = new Date().getTime();
  }

  return {
    isLoading: !subscription.ready(),
    fetchTimestamp,
    listExecution,
    resources,
    dispatch,
    onClose,
  };
})(ListExecution);
