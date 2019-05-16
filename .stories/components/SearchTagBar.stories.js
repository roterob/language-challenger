import React from 'react';
import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';

import '../../client/main.less';
import SearchTagBar from '../../imports/ui/components/SearchTagBar/SearchTagBar';

storiesOf('components.SearchTagBar', module)
  .add('onChange', () => (
    <SearchTagBar tags={['uno', 'dos']} onChange={action('onChange')} />
  ))
  .add('large', () => (
    <SearchTagBar
      tags={['uno', 'dos']}
      onChange={action('onChange')}
      size="default"
    />
  ))
  .add('autocomplete', () => (
    <SearchTagBar
      tags={['uno', 'dos']}
      onChange={action('onChange')}
      size="default"
      autocompleteTags={['uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis']}
    />
  ));
