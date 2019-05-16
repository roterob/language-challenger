const shell = require('shelljs');
const path = require('path');

module.exports = function() {
  return shell.ls(path.join(__dirname, '../../imports/api'));
};
