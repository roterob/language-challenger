import React from 'react';
import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';

import '../../../client/main.less';
import ResourceForm from '../../../imports/ui/pages/Resources/ResourceForm';

storiesOf('pages.Resources.ResourceForm', module).add('default', () => (
  <ResourceForm
    autocompleteTags={['cuatro', 'cinco', 'seis', 'siete']}
    type="vocabulary"
    tags={['uno', 'dos', 'tres']}
    info={{
      es: { text: 'es text', audio: 'es audio' },
      en: { text: 'en text', audio: 'en audio' },
    }}
  />
));
