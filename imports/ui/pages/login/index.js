import { Meteor } from 'meteor/meteor';
import React from 'react';

import Login from './Login';
import dispatch from '../../../modules/dispatch';

function meteorLogin({ userName, password }, callback) {
  const args = ['users.loginWithPassword', userName, password];
  if (callback) {
    args.push(callback);
  }

  dispatch(...args);
}

export default function() {
  return <Login onSubmit={meteorLogin} />;
}
