const getProjectCollections = require('../../.util/get-project-collections');
const getCollectionSubscriptions = require('../../.util/get-collection-subscriptions');

let collection = null;

module.exports = [
  {
    type: 'select',
    name: 'collection',
    message: 'select one',
    choices: ['', ...getProjectCollections()],
    result(answer) {
      collection = answer;
      return answer;
    },
  },
  {
    type: 'select',
    name: 'collection',
    message: 'select one',
    choices: () => ['', ...getCollectionSubscriptions(collection)],
  },
];
