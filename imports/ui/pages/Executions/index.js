import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';

import { ReactiveVar } from 'meteor/reactive-var';

import settings from '../../../../defaultSettings';
import ExecutionsCollection from '../../../api/Executions/Executions';
import UserStatsCollection from '../../../api/Users/UserStats';
import ResourceStatsView from '../../../api/Resources/ResourceStatsView';
import ExecutionsPage from './Executions';

import dispatch from '../../../modules/dispatch';

import buildFilters from '../../../modules/build-filters';

const filtersVar = new ReactiveVar(['from:3 months ago']);
const activeTab = new ReactiveVar('lists');

const handleTabChange = tab => {
  filtersVar.set(filtersVar.get().filter(tag => tag.startsWith('from:')));
  activeTab.set(tab);
};

let fetchTimestamp = null;

export default withTracker(() => {
  const filters = buildFilters(filtersVar.get());

  const subscriptions = [Meteor.subscribe('userStats')];

  if (activeTab.get() === 'lists') {
    subscriptions.push(Meteor.subscribe('executions', filters));
  } else {
    subscriptions.push(Meteor.subscribe('resourcesStats', filters));
  }

  const allReady = subscriptions.every(s => s.ready());

  let data = [];
  let userStats = {};
  let hasMore = false;
  if (allReady) {
    if (activeTab.get() === 'lists') {
      data = ExecutionsCollection.find(filters, {
        sort: { createdAt: -1 },
      }).fetch();
    } else {
      data = ResourceStatsView.find(filters, {
        sort: { createdAt: -1 },
      }).fetch();
    }
    userStats = UserStatsCollection.findOne({ userId: Meteor.userId() });

    if (data.length > settings.maxElementsResult) {
      data = data.slice(0, settings.maxElementsResult);
      hasMore = true;
    }

    fetchTimestamp = new Date().getTime();
  }

  return {
    isLoading: !allReady,
    fetchTimestamp,
    filters: filtersVar.get(),
    onDataQuery: f => filtersVar.set(f),
    data,
    userStats,
    hasMore,
    dispatch,
    activeTab: activeTab.get(),
    onTabChange: handleTabChange,
  };
})(ExecutionsPage);
