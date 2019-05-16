---
to: .stories/pages/<%=name%>/<%=name%>.stories.js
---
import React from 'react';
import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';

import '../../../client/main.less';
import <%=name%> from '../../../imports/ui/pages/<%=name%>/<%=name%>';

import dispatchMock from '../../common/dispatch-mock';

<% if(withFilters) { %>
const filters = { type: null, tags: [] };
<% } %>

storiesOf('pages.<%=name%>.<%=name%>', module)
  .add('isLoading', () => (
<% if(withFilters) { %>
    <<%=name%> isLoading data={[]} fetchTimestamp={null} filters={filters} />
<% } else { %>
    <<%=name%> isLoading data={[]} fetchTimestamp={null} />
<% } %>
  ));
