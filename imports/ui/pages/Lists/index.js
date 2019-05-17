import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';

import { ReactiveVar } from 'meteor/reactive-var';

import settings from '../../../../defaultSettings';
import ListsCollection from '../../../api/Lists/Lists';
import ListStatsCollection from '../../../api/Lists/ListStats';
import ListsPage from './Lists';

import dispatch from '../../../modules/dispatch';

import buildFilters from '../../../modules/build-filters';

const filtersVar = new ReactiveVar({ type: null, tags: [] });

let fetchTimestamp = null;

export default withTracker(() => {
  const filters = buildFilters(filtersVar.get());

  const subscription = Meteor.subscribe('lists', filters);

  let data = [];
  let userStats = [];
  let hasMore = false;
  if (subscription.ready()) {
    data = ListsCollection.find(filters).fetch();
    userStats = ListStatsCollection.find({}).fetch();
    if (data.length > settings.maxElementsResult) {
      data = data.slice(0, settings.maxElementsResult);
      hasMore = true;
    }
    fetchTimestamp = new Date().getTime();
  }

  return {
    isLoading: !subscription.ready(),
    fetchTimestamp,
    filters: filtersVar.get(),
    onDataQuery: f => filtersVar.set(f),
    data,
    userStats,
    hasMore,
    dispatch,
  };
})(ListsPage);
