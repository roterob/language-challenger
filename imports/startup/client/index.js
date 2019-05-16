/* eslint-disable no-unused-expressions */

import React from 'react';
import { render } from 'react-dom';
import { BrowserRouter, Switch } from 'react-router-dom';
import { Meteor } from 'meteor/meteor';
import App from '../../ui/layouts/App';

Meteor.startup(() =>
  render(
    <BrowserRouter>
      <Switch>
        <App />
      </Switch>
    </BrowserRouter>,
    document.getElementById('root'),
  ),
);
