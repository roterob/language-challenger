import React from 'react';
import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';

import '../../../client/main.less';
import ListFormModal from '../../../imports/ui/pages/Resources/ListFormModal';

const data = [
  {
    _id: '1',
    name: 'List1',
    tags: ['uno', 'dos', 'tres'],
    resources: ['key1', 'key2'],
  },
  {
    _id: '2',
    name: 'List2',
    tags: ['uno', 'tres'],
    resources: [],
  },
  {
    _id: '3',
    name: 'List3',
    tags: ['uno', 'dos'],
    resources: ['key5', 'key10'],
  },
];

const handleOnSaving = (resource, callback) => {
  action('onSave')(resource, callback);
  setTimeout(() => callback(), 1000);
};

storiesOf('pages.Resources', module)
  .add('ListFormModal_default', () => (
    <ListFormModal
      data={data}
      index={0}
      onSave={handleOnSaving}
      onClose={action('onClose')}
    />
  ))
  .add('ListFormModal_one phrase', () => (
    <ListFormModal
      list={data[1]}
      onSave={handleOnSaving}
      autocompleteTags={['cuatro', 'cinco', 'seis']}
      onClose={action('onClose')}
    />
  ));
