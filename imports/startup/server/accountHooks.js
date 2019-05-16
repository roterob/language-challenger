import { Accounts } from 'meteor/accounts-base';

Accounts.onCreateUser((options, user) => {
  const { avatar, isAdmin, mustChangePass, menu, name, uiSettings } = options;

  user.profile = null;
  Object.assign(user, {
    avatar,
    isAdmin,
    mustChangePass,
    menu,
    name,
    login: user.username,
    uiSettings,
  });

  return user;
});
