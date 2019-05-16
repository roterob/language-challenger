import React from 'react';
import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';

import { Button } from 'antd';

import '../../client/main.less';

storiesOf('components.Button', module)
  .add('default', () => (
    <Button onClick={action('button-clicked!')}>Un botón</Button>
  ))
  .add('with icon', () => (
    <Button
      onClick={action('button-with-icon-clicked!')}
      icon="search"
      type="primary"
    >
      Un botón
    </Button>
  ));
