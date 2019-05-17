const shell = require('shelljs');
const path = require('path');

module.exports = function(collection) {
  let searchPath = path.join(__dirname, '../../imports/api');
  if (collection) {
    searchPath = path.join(searchPath, collection);
  }

  searchPath = path.join(searchPath, '/**/publications.js');

  const re = /Meteor\.publish\('(.*)'/;
  const res = [];
  shell
    .grep('Meteor.publish\\(', searchPath)
    .stdout.split('\n')
    .forEach(v => {
      const m = re.exec(v);
      if (m) {
        res.push(m[1]);
      }
    });

  return res;
};
