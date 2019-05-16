import React from 'react';
import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';

import '../../../client/main.less';
import ResourceFormModal from '../../../imports/ui/pages/Resources/ResourceFormModal';

import data from './data';

const handleOnSaving = (resource, callback) => {
  action('onSave')(resource, callback);
  setTimeout(() => callback(null), 1000);
};

storiesOf('pages.Resources.ResourceFormModal', module).add('default', () => (
  <ResourceFormModal
    data={data}
    index={0}
    onSave={handleOnSaving}
    onClose={action('onClose')}
  />
));
