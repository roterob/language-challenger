import React, { useState, useMemo } from 'react';

import Avatar from 'antd/lib/avatar';

import PageHeaderWrapper from '../../components/PageHeaderWrapper';
import SearchTagBar from '../../components/SearchTagBar';
import { fromField, execStateField } from '../../../modules/build-filters';
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

  const collectedTags = useMemo(() => {
    const res = [];
    data.forEach(r => res.push(...r.tags));

    return [...new Set(res)];
  }, [fetchTimestamp]);

  const handleTagClick = tag => {
    onDataQuery([...filters, tag]);
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
        <div className={styles.contentTitle}>My activity</div>

        <div>
          <SearchTagBar
            tags={filters}
            onChange={onDataQuery}
            fields={[fromField, execStateField]}
            autocompleteTags={collectedTags}
          />
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
