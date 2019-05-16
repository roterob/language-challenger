// see types of prompts:
// https://github.com/enquirer/enquirer/tree/master/examples
//
module.exports = [
  {
    type: 'input',
    name: 'name',
    message: 'name?',
  },
  {
    type: 'input',
    name: 'props',
    message: 'props names separated by ,',
    initial: '',
  },
  {
    type: 'input',
    name: 'antd',
    message: 'initial antd imports names separated by ,',
    initial: '',
  },
];
