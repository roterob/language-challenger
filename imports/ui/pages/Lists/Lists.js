import React, { useState, useMemo } from 'react';
import classNames from 'classnames';

import Row from 'antd/lib/row';
import Col from 'antd/lib/col';
import Avatar from 'antd/lib/avatar';
import Sping from 'antd/lib/spin';

import PageHeaderWrapper from '../../components/PageHeaderWrapper';
import TagInput from '../../components/SearchTagBar/TagInput';
import ListsTable from './ListsTable';
import ListFormModal from '../Resources/ListFormModal';
import ListExecution from '../../components/ListExecution';
import styles from '../index.less';

import arrayToHashmap from '../../../modules/array-to-hashmap';

function Lists({
  isLoading,
  data,
  userStats,
  fetchTimestamp,
  filters,
  hasMore,
  onDataQuery,
  dispatch,
}) {
  const [resourceIndex, setResourceIndex] = useState(null);
  const [executionId, setExecutionId] = useState(null);

  const dataWithStas = useMemo(() => {
    const statsHashmap = arrayToHashmap('listId', userStats);
    const res = [];
    data.forEach(l => res.push({ ...l, stats: statsHashmap[l._id] }));
    return res;
  }, [fetchTimestamp]);

  const collectedTags = useMemo(() => {
    const res = [];
    data.forEach(r => res.push(...r.tags));

    return [...new Set(res)];
  }, [fetchTimestamp]);

  const handleTagClick = tag => {
    const { type, tags } = filters;

    if (tags.indexOf(tag) < 0) {
      handleSearchChange({ type, tags: [...tags, tag] });
    }
  };

  const handleSearchChange = ({ type, tags }) => {
    onDataQuery({ type, tags });
  };

  const handleSaveList = (list, callback) => {
    dispatch('lists.save', list, callback);
  };

  const handleCloseEditList = () => {
    setResourceIndex(null);
  };

  const handleCloseExecution = () => {
    setExecutionId(null);
  };

  const handleEditList = (id, resource, index) => {
    setResourceIndex(index);
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

  const { type, tags } = filters;

  const headerContent = (
    <div className={styles.pageHeaderContent}>
      <div className={styles.avatar}>
        <Avatar size={64} icon="bars" />
      </div>
      <div className={styles.content}>
        <div className={styles.contentTitle}>Lists</div>
        <div>
          <TagInput
            tags={tags}
            onChange={tags => handleSearchChange({ type: null, tags })}
            autocompleteTags={collectedTags}
          />
        </div>
      </div>
    </div>
  );

  const extraContent = isLoading ? (
    <Sping delay={500} />
  ) : (
    <div className={styles.extraContent}>
      <div className={styles.statItem}>
        <p>Count</p>
        <p className={classNames({ [styles.hasmore]: hasMore })}>
          {data.length}
        </p>
      </div>
    </div>
  );

  return (
    <PageHeaderWrapper content={headerContent} extraContent={extraContent}>
      <React.Fragment>
        <Row>
          <Col span={24}>
            <ListsTable
              isLoading={isLoading}
              fetchTimestamp={fetchTimestamp}
              showSpin
              data={dataWithStas}
              onTagClick={handleTagClick}
              onEditClick={handleEditList}
              onStartList={handleStartList}
            />
          </Col>
        </Row>
        {resourceIndex !== null && resourceIndex < data.length && (
          <ListFormModal
            data={data}
            index={resourceIndex}
            onSave={handleSaveList}
            onClose={handleCloseEditList}
            autocompleteTags={collectedTags}
          />
        )}
        {executionId !== null && (
          <ListExecution
            executionId={executionId}
            onClose={handleCloseExecution}
          />
        )}
      </React.Fragment>
    </PageHeaderWrapper>
  );
}

export default Lists;
