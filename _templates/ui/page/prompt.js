const getProjectCollections = require('../../.util/get-project-collections');
const getCollectionSubscriptions = require('../../.util/get-collection-subscriptions');

let collection = null;

module.exports = [
  {
    type: 'input',
    name: 'name',
    message: 'file name?',
  },
  {
    type: 'input',
    name: 'title',
    message: 'page title?',
  },
  {
    type: 'input',
    name: 'icon',
    message: 'page icon?',
    initial: 'file-text',
  },
  {
    type: 'confirm',
    name: 'withFilters',
    message: 'has filters?',
    initial: false,
  },
  {
    type: 'select',
    name: 'collection',
    message: 'meteor collection?',
    choices: ['', ...getProjectCollections()],
    result(answer) {
      collection = answer;
      return answer;
    },
  },
  {
    type: 'select',
    name: 'subscribeTo',
    message: 'meteor subscription?',
    choices: () => ['', ...getCollectionSubscriptions(collection)],
  },
];
