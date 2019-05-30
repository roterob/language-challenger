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
} from '../../../modules/build-filters';
import ExecutionsTable from './ExecutionsTable';
import ResourcesTable from './ResourcesTable';
import UserStats from './UserStats';
import ListExecution from '../../components/ListExecution';
import ResourceForm from '../Resources/ResourceFormModal';

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
}) {
  const [executionId, setExecutionId] = useState(null);
  const [resourceIndex, setResourceIndex] = useState(null);

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

  const handleResourceToggleFav = resourceId => {
    dispatch('resources.toggleFavourite', resourceId);
  };

  const handleResourceStartList = list => {
    dispatch('executions.create', list, (err, res) => {
      callback(err, res);

      if (!err) {
        setExecutionId(res);
      }

      return true;
    });
  };

  const handleResourceEdit = (id, resource, index) => {
    setResourceIndex(index);
  };

  const handleResourceSave = (resource, callback) => {
    dispatch('resources.save', resource, callback);
  };

  const handleResourceClose = () => {
    setResourceIndex(null);
  };

  const getFilterFields = () => {
    let res = [fromField, execStateField, automaticField];
    if (activeTab !== 'lists') {
      res = [fromField, typeField, favouriteField];
    }
    return res;
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
          fetchTimestamp={fetchTimestamp}
          {...userStats}
        />
      }
    >
      {activeTab === 'lists' ? (
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
      ) : (
        <React.Fragment>
          <ResourcesTable
            data={data}
            isLoading={isLoading}
            fetchTimestamp={fetchTimestamp}
            showSpin
            onTagClick={handleTagClick}
            onEditClick={handleResourceEdit}
            onCreateList={handleResourceStartList}
            onToggleFavourite={handleResourceToggleFav}
          />
          {resourceIndex != null && (
            <ResourceForm
              data={data.map(d => d.resource)}
              index={resourceIndex}
              autocompleteTags={collectedTags}
              onSave={handleResourceSave}
              onClose={handleResourceClose}
            />
          )}
        </React.Fragment>
      )}
    </PageHeaderWrapper>
  );
}

export default Executions;
