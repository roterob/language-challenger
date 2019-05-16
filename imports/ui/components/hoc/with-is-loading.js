import React from 'react';
import Loading from '../PageLoading';

export default WrappedComponent => {
  return class extends React.Component {
    state = {
      prevFetchTimestamp: null,
      currentFetchTimestamp: null,
    };

    static getDerivedStateFromProps(nextProps, state) {
      const { currentFetchTimestamp: prevFetchTimestamp } = state;
      const { fetchTimestamp: currentFetchTimestamp } = nextProps;

      return {
        prevFetchTimestamp,
        currentFetchTimestamp,
      };
    }

    shouldComponentUpdate(nextProps, nextState) {
      const { prevFetchTimestamp, currentFetchTimestamp } = nextState;

      return (
        !nextProps.isLoading && prevFetchTimestamp != currentFetchTimestamp
      );
    }
    render() {
      const { isLoading, showSpin } = this.props;

      return isLoading && showSpin ? (
        <Loading />
      ) : (
        <WrappedComponent {...this.props} />
      );
    }
  };
};
