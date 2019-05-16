---
to: .stories/components/<%=name%>.stories.js
---
import React from 'react';
import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';

import '../../client/main.less';
import <%=name%> from '../../imports/ui/components/<%=name%>/<%=name%>';

storiesOf('components.<%=name%>', module)
  .add('default', () => (
    <<%=name%> />
  ));
