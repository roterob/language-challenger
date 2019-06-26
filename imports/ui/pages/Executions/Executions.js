import React, { useState, useMemo } from 'react';

import Avatar from 'antd/lib/avatar';

import PageHeaderWrapper from '../../components/PageHeaderWrapper';
import SearchTagBar from '../../components/SearchTagBar';
import {
  fromField,
  execStateField,
  automaticField,
  typeField,
  favouriteField,
  lastResult,
} from '../../../modules/build-filters';
import ExecutionsTable from './ExecutionsTable';
import ResourcesTable from './ResourcesTable';
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
  activeTab,
  onTabChange,
  isMobile,
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
    });
  };

  const handleReviewList = execId => {
    setExecutionId(execId);
  };

  const handleExecutionClose = () => {
    setExecutionId(null);
  };

  const handleResourceToggleFav = resourceId => {
    dispatch('resources.toggleFavourite', resourceId);
  };

  const handleResourceStartList = list => {
    dispatch('executions.startTemp', list, (err, res) => {
      if (!err) {
        setExecutionId(res);
      }
    });
  };

  const handleResourceSave = (resource, callback) => {
    dispatch('resources.save', resource, callback);
  };

  const getFilterFields = () => {
    let res = [fromField, execStateField, automaticField];
    if (activeTab === 'resources') {
      res = [fromField, typeField, favouriteField, lastResult];
    }
    return res;
  };

  const headerContent = (
    <div className={styles.pageHeaderContent}>
      {!isMobile && (
        <div className={styles.avatar}>
          <Avatar size={64} icon="thunderbolt" />
        </div>
      )}
      <div className={styles.content}>
        <div className={styles.contentTitle}>My activity</div>
        <div>
          <SearchTagBar
            tags={filters}
            onChange={onDataQuery}
            fields={getFilterFields()}
            autocompleteTags={collectedTags}
          />
        </div>
      </div>
    </div>
  );

  return (
    <PageHeaderWrapper
      content={headerContent}
      tabActiveKey={activeTab}
      onTabChange={k => onTabChange(k)}
      tabList={[
        { tab: 'Lists', key: 'lists' },
        { tab: 'Resources', key: 'resources' },
      ]}
      extraContent={
        <UserStats
          isLoading={isLoading}
          isMobile={isMobile}
          fetchTimestamp={fetchTimestamp}
          {...userStats}
        />
      }
    >
      <React.Fragment>
        {activeTab === 'lists' ? (
          <ExecutionsTable
            data={data}
            isLoading={isLoading}
            fetchTimestamp={fetchTimestamp}
            showSpin
            onTagClick={handleTagClick}
            onStartList={handleStartList}
            onReviewList={handleReviewList}
          />
        ) : (
          <ResourcesTable
            data={data}
            isLoading={isLoading}
            fetchTimestamp={fetchTimestamp}
            showSpin
            tags={collectedTags}
            onTagClick={handleTagClick}
            onCreateList={handleResourceStartList}
            onToggleFavourite={handleResourceToggleFav}
            onSaveResource={handleResourceSave}
          />
        )}
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
