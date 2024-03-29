import React, { useState, useMemo } from 'react';
import classNames from 'classnames';

import Row from 'antd/lib/row';
import Col from 'antd/lib/col';
import Avatar from 'antd/lib/avatar';
import Sping from 'antd/lib/spin';

import PageHeaderWrapper from '../../components/PageHeaderWrapper';
import SearchTagBar from '../../components/SearchTagBar';
import { typeField } from '../../../modules/build-filters';
import ResourcesTable from './ResourcesTable';
import ResourceFormModal from './ResourceFormModal';
import ListFormModal from './ListFormModal';
import styles from '../index.less';

function Resources({
  isLoading,
  data,
  fetchTimestamp,
  filters,
  hasMore,
  onDataQuery,
  dispatch,
  isMobile,
}) {
  const [resourceIndex, setResourceIndex] = useState(null);
  const [list, setList] = useState(null);

  useMemo(() => {
    if (resourceIndex !== null && resourceIndex >= data.length) {
      const newIndex = data.length - 1;
      setResourceIndex(newIndex >= 0 ? newIndex : null);
    }
  }, [fetchTimestamp]);

  const collectedTags = useMemo(() => {
    const res = [];
    data.forEach(r => res.push(...r.tags));

    return [...new Set(res)];
  }, [fetchTimestamp]);

  const handleTagClick = tag => {
    if (filters.indexOf(tag) < 0) {
      handleSearchChange([...filters, tag]);
    }
  };

  const handleTypeClick = type => {
    const newFilters = filters.filter(f => !f.startsWith('type:'));
    handleSearchChange([`type:${type}`, ...newFilters]);
  };

  const handleSearchChange = tags => {
    onDataQuery(tags);
  };

  const handleSaveResource = (resource, callback) => {
    dispatch('resources.save', resource, callback);
  };

  const handleCloseModal = () => {
    setResourceIndex(null);
  };

  const handleEditResource = (id, resource, index) => {
    setResourceIndex(index);
  };

  const handleCreateResource = () => {
    setResourceIndex(-1);
  }

  const handleCreateList = list => {
    setList(list);
  };

  const handleCancelCreateList = () => {
    setList(null);
  };

  const handleSaveList = (list, callback) => {
    dispatch('lists.save', list, (err, res) => {
      if (!err) {
        setList(null);
      } else {
        callback(err, res);
      }
    });
  };

  const headerContent = (
    <div className={styles.pageHeaderContent}>
      {!isMobile && (
        <div className={styles.avatar}>
          <Avatar size={64} icon="database" />
        </div>
      )}
      <div className={styles.content}>
        <div className={styles.contentTitle}>Resources</div>
        <div>
          <SearchTagBar
            tags={filters}
            onChange={handleSearchChange}
            autocompleteTags={collectedTags}
            fields={[typeField]}
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
    <PageHeaderWrapper
      isMobile
      content={headerContent}
      extraContent={extraContent}
    >
      <React.Fragment>
        <Row>
          <Col span={24}>
            <ResourcesTable
              isLoading={isLoading}
              fetchTimestamp={fetchTimestamp}
              showSpin
              data={data}
              onTagClick={handleTagClick}
              onTypeClick={handleTypeClick}
              onEditClick={handleEditResource}
              onCreateList={handleCreateList}
              onCreateResource={handleCreateResource}
            />
          </Col>
        </Row>
        {resourceIndex !== null && resourceIndex < data.length && (
          <ResourceFormModal
            data={data}
            index={resourceIndex}
            onSave={handleSaveResource}
            onClose={handleCloseModal}
            autocompleteTags={collectedTags}
          />
        )}
        {list !== null && (
          <ListFormModal
            list={list}
            onClose={handleCancelCreateList}
            onSave={handleSaveList}
          />
        )}
      </React.Fragment>
    </PageHeaderWrapper>
  );
}

export default Resources;
