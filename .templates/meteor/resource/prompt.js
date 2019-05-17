// see types of prompts:
// https://github.com/enquirer/enquirer/tree/master/examples
//
module.exports = [
  {
    type: 'input',
    name: 'name',
    message: 'name?',
    initial: 'Books',
  },
  {
    type: 'input',
    name: 'fields',
    message: 'field names separated by ,',
    initial: '',
  },
  {
    type: 'input',
    name: 'methods',
    message: 'methods names separated by ,',
    initial: '',
  },
];
