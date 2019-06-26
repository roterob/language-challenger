import { Migrations } from 'meteor/percolate:migrations';
import { Accounts } from 'meteor/accounts-base';

import Resources from '../../api/Resources/Resources';
import ResourceStats from '../../api/Resources/ResourceStats';

Migrations.add({
  version: 1,
  name: 'Initial migration',
  up() {
    //1. Default admin user
    Accounts.createUser({
      email: 'admin@mail.es',
      username: 'admin',
      password: 'adminPass',
      name: 'Administrator',
      avatar:
        'https://s3.amazonaws.com/uifaces/faces/twitter/madebybrenton/128.jpg',
      isAdmin: true,
      mustChangePass: false,
      menu: [],
      uiSettings: {
        collapsed: false,
      },
    });

    //2. Indexes
    Resources.rawCollection().createIndex({ tags: 1 });
  },
});

Migrations.add({
  version: 2,
  name: 'Views',
  up() {
    const db = Resources.rawDatabase();
    db.createCollection('ResourceStatsView', {
      viewOn: 'ResourceStats',
      pipeline: [
        {
          $lookup: {
            from: 'Resources',
            localField: 'resourceId',
            foreignField: '_id',
            as: 'resource',
          },
        },
        { $unwind: '$resource' },
        {
          $addFields: {
            type: '$resource.type',
            tags: '$resource.tags',
            createdAt: '$lastExec',
          },
        },
      ],
    });
  },
});

Migrations.add({
  version: 3,
  name: 'Fixes 1',
  up() {
    ResourceStats.find().forEach(function(item) {
      item.lastResult = item.correct > 0 && item.incorrect == 0;
      ResourceStats.update(item._id, { $set: item });
    });
  },
});
