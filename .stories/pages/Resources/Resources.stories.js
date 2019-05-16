import React from 'react';
import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';

import '../../../client/main.less';
import Resources from '../../../imports/ui/pages/Resources/Resources';

import dispatchMock from '../../common/dispatch-mock';

import data from './data';

const filters = { type: null, tags: [] };

storiesOf('pages.Resources.Resources', module)
  .add('isLoading', () => (
    <Resources isLoading data={[]} fetchTimestamp={null} filters={filters} />
  ))
  .add('withData', () => (
    <Resources
      isLoading={false}
      data={data}
      fetchTimestamp={0}
      filters={filters}
      onDataQuery={action('onDataQuery')}
      dispatch={dispatchMock}
    />
  ));
