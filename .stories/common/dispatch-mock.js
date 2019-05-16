import { action } from '@storybook/addon-actions';

export default function() {
  let callback = null;
  if (
    arguments.length > 0 &&
    typeof arguments[arguments.length - 1] === 'function'
  ) {
    callback = arguments[arguments.length - 1];
  }

  action('dispacth')(arguments);
  if (callback) {
    setTimeout(() => callback(null), 1000);
  }
}
