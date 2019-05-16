import React from 'react';

// when pass to getFieldDecorator a stateless component get this
// warning: react-dom.development.js:506 Warning: Function components cannot be given refs. Attempts to access this ref will fail. Did you mean to use React.forwardRef()?
// https://github.com/react-component/form/issues/287

export default ComponentWrapped => {
  return class extends React.Component {
    render() {
      const { children, ...props } = this.props;
      return <ComponentWrapped {...props}>{children}</ComponentWrapped>;
    }
  };
};
