import React from 'react';

const AppGlobalContext = React.createContext();

export const withAppContext = WrappedComponent => props => (
  <AppGlobalContext.Consumer>
    {context => <WrappedComponent context={context} {...props} />}
  </AppGlobalContext.Consumer>
);

export default AppGlobalContext;
