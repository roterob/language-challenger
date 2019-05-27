import Tasks from './Tasks';
import Imports from './Imports';
import Resources from '../Resources/Resources';
import fs from 'fs';

const UPDATE_EACH = 50;

const sleep = n => {
  return new Promise(resolve => {
    setTimeout(resolve, n);
  });
};

export default async (taskId, file) => {
  try {
    const data = fs.readFileSync(file.path);
    const json = JSON.parse(data);

    let count = 0;
    for (let i = 0; i < json.length; i++) {
      const r = json[i];

      Resources.insert({
        resourceCode: r.id,
        type: r.type || 'phrase',
        tags: r.tags,
        info: {
          es: {
            text: r.es,
            audio: r.resource_es,
          },
          en: {
            text: r.en,
            audio: r.resource_en,
          },
        },
      });

      if (count >= UPDATE_EACH) {
        Tasks.update(taskId, {
          $set: {
            updatedAt: new Date(),
            current: i,
            total: json.length,
          },
        });

        count = 0;
        await sleep(300);
      }

      count++;
    }
  } catch (e) {
    Tasks.update(taskId, {
      $set: {
        status: 'finished',
        updatedAt: new Date(),
        finishedAt: new Date(),
        error: e.reason || e,
      },
    });
  } finally {
    Imports.remove(file._id);
    Tasks.update(taskId, {
      $set: {
        status: 'finished',
        updatedAt: new Date(),
        finishedAt: new Date(),
      },
    });
  }
};
