import { FilesCollection } from 'meteor/ostrio:files';
import Tasks from './Tasks';

const Imports = new FilesCollection({
  collectionName: 'Imports',
  allowClientCode: true,
  onBeforeUpload(file) {
    if (file.size <= 10485760 && /json/i.test(file.extension)) {
      return true;
    } else {
      return 'Only json files less than 10MB';
    }
  },
  onAfterUpload(fileRef) {
    //Only on server
    import importResources from './import-resources';
    const taskId = Tasks.insert({
      fileId: fileRef._id,
      fileName: fileRef.name,
      status: 'inProgress',
      current: 0,
      total: 0,
      error: '',
      createdAt: new Date(),
    });
    Meteor.defer(() => importResources(taskId, fileRef));
  },
});

if (Meteor.isServer) {
  Imports.allow({
    insert: () => true,
    update: () => false,
    remove: () => false,
  });
}

export default Imports;
