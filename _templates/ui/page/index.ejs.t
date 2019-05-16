---
to: imports/ui/pages/<%=name%>/index.js
---

import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';
<% if(withFilters) { %>
import { ReactiveVar } from 'meteor/reactive-var';
<% } %>

import settings from '../../../../defaultSettings';
import <%=collection%>Collection from '../../../api/<%=collection%>/<%=collection%>';
import <%=name%>Page from './<%=name%>';

import dispatch from '../../../modules/dispatch';
<% if(withFilters) { %>
import buildFilters from '../../../modules/build-filters';

const filtersVar = new ReactiveVar({ type: null, tags: [] });
<% } %>
let fetchTimestamp = null;

export default withTracker(() => {
  const filters = buildFilters(filtersVar.get());
  <% if(withFilters) { %>
  const subscription = Meteor.subscribe('<%=subscribeTo%>', filters);
  <% } else { %>
  const subscription = Meteor.subscribe('<%=subscribeTo%>');
  <% } %>

  let data = [];
  let hasMore = false;
  if (subscription.ready()) {
    data = <%=collection%>Collection.find(filters).fetch();
    if (data.length > settings.maxElementsResult) {
      data = data.slice(0, settings.maxElementsResult);
      hasMore = true;
    }
    fetchTimestamp = new Date().getTime();
  }

  return {
    isLoading: !subscription.ready(),
    fetchTimestamp,
  <% if(withFilters) { %>
    filters: filtersVar.get(),
    onDataQuery: f => filtersVar.set(f),
  <% } %>
    data,
    hasMore,
    dispatch,
  };
})(<%=name%>Page);
