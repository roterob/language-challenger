import React from 'react';
import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';

import '../../../client/main.less';
import Executions from '../../../imports/ui/pages/Executions/Executions';
import dispatchMock from '../../common/dispatch-mock';

import { executions, userStats } from './data';

const filters = [];

storiesOf('pages.Executions', module)
  .add('isLoading', () => (
    <Executions isLoading data={[]} fetchTimestamp={null} filters={filters} />
  ))
  .add('withData', () => (
    <Executions
      isLoading={false}
      data={executions}
      userStats={userStats}
      fetchTimestamp={new Date().getTime()}
      filters={filters}
      dispatch={dispatchMock}
    />
  ));
