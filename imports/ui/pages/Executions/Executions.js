import React, { useState, useMemo } from 'react';

import Avatar from 'antd/lib/avatar';

import PageHeaderWrapper from '../../components/PageHeaderWrapper';
import TagInput from '../../components/SearchTagBar/TagInput';
import ExecutionsTable from './ExecutionsTable';
import UserStats from './UserStats';
import ListExecution from '../../components/ListExecution';

import styles from '../index.less';

function Executions({
  isLoading,
  data,
  userStats,
  fetchTimestamp,
  hasMore,
  dispatch,
  filters,
  onDataQuery,
}) {
  const [executionId, setExecutionId] = useState(null);
  const { type, tags } = filters;

  const handleTagInputChange = tags => {
    onDataQuery({ type: null, tags });
  };

  const handleTagClick = tag => {
    onDataQuery({ type: null, tags: [...tags, tag] });
  };

  const handleStartList = (listId, callback) => {
    dispatch('executions.start', listId, (err, res) => {
      callback(err, res);

      if (!err) {
        setExecutionId(res);
      }

      return true;
    });
  };

  const handleReviewList = execId => {
    setExecutionId(execId);
  };

  const handleExecutionClose = () => {
    setExecutionId(null);
  };

  const headerContent = (
    <div className={styles.pageHeaderContent}>
      <div className={styles.avatar}>
        <Avatar size={64} icon="thunderbolt" />
      </div>
      <div className={styles.content}>
        <div className={styles.contentTitle}>My executions</div>

        <div>
          <TagInput tags={tags} onChange={handleTagInputChange} />
        </div>
      </div>
    </div>
  );

  return (
    <PageHeaderWrapper
      content={headerContent}
      extraContent={
        <UserStats
          isLoading={isLoading}
          fetchTimestamp={fetchTimestamp}
          {...userStats}
        />
      }
    >
      <React.Fragment>
        <ExecutionsTable
          data={data}
          isLoading={isLoading}
          fetchTimestamp={fetchTimestamp}
          showSpin
          onTagClick={handleTagClick}
          onStartList={handleStartList}
          onReviewList={handleReviewList}
        />
        {executionId != null && (
          <ListExecution
            executionId={executionId}
            onClose={handleExecutionClose}
          />
        )}
      </React.Fragment>
    </PageHeaderWrapper>
  );
}

export default Executions;
