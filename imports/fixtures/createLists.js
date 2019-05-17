import Lists from '../api/Lists/Lists';
import Resources from '../api/Resources/Resources';
import faker from 'faker';

function getResources(resources, count) {
  const res = [];

  for (let i = 0; i < count; i++) {
    let resource = null;

    do {
      resource = faker.random.arrayElement(resources);
    } while (res.findIndex(r => r._id == resource._id) >= 0);
    res.push(resource);
  }

  return res;
}

function getTags(resources) {
  const tags = [];
  resources.forEach(r => tags.push(...r.tags));

  const res = [...new Set(tags)];

  return res.splice(0, Math.min(3, res.length - 1));
}

export default () => {
  if (Lists.find().count() == 0) {
    const resources = Resources.find().fetch();

    for (let i = 0; i < 50; i++) {
      const listResources = getResources(resources, 10);
      const tags = getTags(listResources);

      const list = {
        name: `List ${i + 1}`,
        tags,
        resources: listResources.map(r => r._id),
      };

      Lists.insert(list);
    }
  }
};
