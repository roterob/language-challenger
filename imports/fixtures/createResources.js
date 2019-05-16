import Resources from '../api/Resources/Resources';
import faker from 'faker';

function generateTags() {
  return [
    faker.random.arrayElement(['Booklet1', 'Booklet2', 'Booklet3']),
    faker.random.arrayElement(['List1', 'List2', 'List3', 'List4', 'List5']),
  ];
}

export default () => {
  for (let i = 0; i < 100; i++) {
    const resource = {
      type: faker.random.arrayElement(['vocabulary', 'phrase', 'paragraph']),
      tags: generateTags(),
      info: {
        es: {
          text: faker.lorem.sentence(),
          audio: faker.internet.url(),
        },
        en: {
          text: faker.lorem.sentence(),
          audio: faker.internet.url(),
        },
      },
    };

    Resources.insert(resource);
  }
};
