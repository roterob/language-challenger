import React from 'react';
import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';

import '../../client/main.less';
import SearchTagBar, {
  typeField,
  fromField,
} from '../../imports/ui/components/SearchTagBar';
import buildFilters from '../../imports/modules/build-filters';
import { stringToDate } from '../../imports/modules/date-helpers';

function onChange() {
  const tags = arguments[0];
  const filters = buildFilters(tags, fields);
  action('onchange')(tags, filters);
}

storiesOf('components.SearchTagBar', module)
  .add('onChange', () => (
    <SearchTagBar tags={['uno', 'dos']} onChange={onChange} />
  ))
  .add('large', () => (
    <SearchTagBar tags={['uno', 'dos']} onChange={onChange} size="default" />
  ))
  .add('autocomplete', () => (
    <SearchTagBar
      tags={['uno', 'dos', 'type:vocabulary', 'from:2 days ago']}
      size="default"
      onChange={onChange}
      autocompleteTags={['uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis']}
      fields={[typeField, fromField]}
    />
  ));
