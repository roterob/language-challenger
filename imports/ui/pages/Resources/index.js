import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { withTracker } from 'meteor/react-meteor-data';

import settings from '../../../../defaultSettings';
import ResourcesCollection from '../../../api/Resources/Resources';
import ResourcesPage from './Resources';

import dispatch from '../../../modules/dispatch';
import buildFilters from '../../../modules/build-filters';

const filtersVar = new ReactiveVar({ type: null, tags: [] });
let fetchTimestamp = null;

export default withTracker(() => {
  const filters = buildFilters(filtersVar.get());
  const subscription = Meteor.subscribe('resources', filters);

  let data = [];
  let hasMore = false;
  if (subscription.ready()) {
    data = ResourcesCollection.find(filters).fetch();
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
    data,
    hasMore,
    onDataQuery: f => filtersVar.set(f),
    dispatch,
  };
})(ResourcesPage);
