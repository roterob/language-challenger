import React from 'react';
import { storiesOf } from '@storybook/react';

import '../../../client/main.less';
import ListExecution from '../../../imports/ui/components/ListExecution/ListExecution';

import dispatchMock from '../../common/dispatch-mock';

import { resources, listExecution, listExecutionFinished } from './data';

const executionConfig = {
  questionLang: 'es',
  playQuestion: false,
  playAnswer: true,
};

storiesOf('components.ListExecution', module)
  .add('isLoading', () => (
    <ListExecution isLoading={true} fetchTimestamp={new Date().getTime()} />
  ))
  .add('config', () => (
    <ListExecution
      isLoading={false}
      listExecution={listExecution}
      resources={resources}
      fetchTimestamp={new Date().getTime()}
      dispatch={dispatchMock}
    />
  ))
  .add('inProgress', () => (
    <ListExecution
      isLoading={false}
      listExecution={{ ...listExecution, config: executionConfig }}
      resources={resources}
      fetchTimestamp={new Date().getTime()}
      dispatch={dispatchMock}
    />
  ))
  .add('finished', () => (
    <ListExecution
      isLoading={false}
      listExecution={{ ...listExecutionFinished, config: executionConfig }}
      resources={resources}
      fetchTimestamp={new Date().getTime()}
      dispatch={dispatchMock}
    />
  ))
  .add('empty', () => (
    <ListExecution
      isLoading={false}
      listExecution={{
        ...listExecution,
        results: [],
        config: executionConfig,
      }}
      resources={resources}
      fetchTimestamp={new Date().getTime()}
      dispatch={dispatchMock}
    />
  ));
