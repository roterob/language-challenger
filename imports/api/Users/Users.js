import { Meteor } from 'meteor/meteor';
import SimpleSchema from 'simpl-schema';

const Users = Meteor.users;

Users.allow({
  insert: () => false,
  update: () => false,
  remove: () => false,
});

Users.deny({
  insert: () => true,
  update: () => true,
  remove: () => true,
});

Users.schema = new SimpleSchema({
  username: { type: String },
  login: { type: String },
  emails: { type: Array },
  'emails.$': { type: Object },
  'emails.address': { type: String },
  'emails.verified': { type: Boolean },
  password: { type: String, optional: true },
  name: { type: String },
  avatar: { type: String },
  isAdmin: { type: Boolean, defaultValue: false },
  mustChangePass: { type: Boolean, defaultValue: false },
  menu: { type: Array, defaultValue: [] },
  'menu.$': { type: Object },
  'menu.$.key': { type: String },
  'menu.$.title': { type: String },
  'menu.$.icon': { type: String },
  uiSettings: { type: Object, blackbox: true },
  services: { type: Object, blackbox: true },
});

Users.publicFields = {
  _id: 1,
  username: 1,
  name: 1,
  avatar: 1,
};

Users.attachSchema(Users.schema);

export default Users;
