import { Migrations } from 'meteor/percolate:migrations';
import { Accounts } from 'meteor/accounts-base';

import Resources from '../../api/Resources/Resources';
import ResourceStats from '../../api/Resources/ResourceStats';
import Executions from '../../api/Executions/Executions';

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

Migrations.add({
  version: 4,
  name: 'Fixes Executions listIds',
  up() {
    Executions.find({}, { fields: { listId: 1 } }).forEach(function(item) {
      const { _id, listId } = item;
      if (listId) {
        const newListId = listId.split('_');
        Executions.update(_id, { $set: { listId: newListId } });
      }
    });
  },
});

Migrations.add({
  version: 5,
  name: 'Fixes Exectuions results',
  up() {
    Executions.remove({ inProgress: true });
  },
});
