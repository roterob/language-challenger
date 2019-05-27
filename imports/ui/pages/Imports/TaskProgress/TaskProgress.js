import React, { useMemo } from 'react';

import Progress from 'antd/lib/progress';

export default ({ isLoading, data, onFinish }) => {
  const { status } = data;
  useMemo(() => {
    if (!isLoading && data.status && data.status != 'inProgress') {
      onFinish(data);
    }
  }, [status]);

  const getProgress = () => {
    let res = 0;
    if (data.status == 'finished') {
      res = 100;
    } else {
      res = (data.current / data.total) * 100;
    }
    return res;
  };

  const getStatus = () => {
    let res = null;
    if (data.status == 'inProgress') {
      res = 'active';
    } else if (data.status == 'aborted' || data.error) {
      res = 'exception';
    }
    return res;
  };

  return isLoading ? (
    <span>Loading...</span>
  ) : data == null ? (
    <span>Task not founded</span>
  ) : (
    <Progress size="small" percent={getProgress()} status={getStatus()} />
  );
};
