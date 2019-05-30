import React from 'react';
import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';

import '../../../client/main.less';
import Lists from '../../../imports/ui/pages/Lists/Lists';

import dispatchMock from '../../common/dispatch-mock';
import { lists, userStats } from './data';

const filters = [];

storiesOf('pages.Lists', module)
  .add('isLoading', () => (
    <Lists
      isLoading
      data={[]}
      userStats={[]}
      fetchTimestamp={null}
      filters={filters}
    />
  ))
  .add('withData', () => (
    <Lists
      isLoading={false}
      data={lists}
      userStats={userStats}
      fetchTimestamp={0}
      filters={filters}
      onDataQuery={action('onDataQuery')}
      dispatch={dispatchMock}
    />
  ));
