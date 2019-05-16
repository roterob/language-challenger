import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';
import { withRouter } from 'react-router-dom';
import UsersCollection from '../../../api/Users/Users';
import dispatch from '../../../modules/dispatch';
import defaultSettings from '../../../../defaultSettings';

import App from './App';

export default withTracker(() => {
  const userId = Meteor.userId(); // This is a reactive function
  const isAuthenticated = userId != null;

  const context = {};
  let user = {};
  let globalSettings = {};
  let allReady = false;

  if (isAuthenticated) {
    const subscriptions = [
      // Meteor.subscribe('context'),
      Meteor.subscribe('user', userId),
    ];

    allReady = subscriptions.every(handler => handler.ready());

    if (allReady) {
      context.userId = userId;
      context.user = UsersCollection.findOne(userId);
      globalSettings = { ...defaultSettings, ...user.uiSettings };
    }
  }

  return {
    isLoading: !allReady,
    isAuthenticated,
    context,
    dispatch,
    globalSettings,
  };
})(withRouter(App));
