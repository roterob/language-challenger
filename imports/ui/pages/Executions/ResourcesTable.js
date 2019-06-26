import React, { useState, useMemo } from 'react';
import moment from 'moment';

import Table from 'antd/lib/table';
import Tag from 'antd/lib/tag';
import Row from 'antd/lib/row';
import Col from 'antd/lib/col';
import Button from 'antd/lib/button';
import Card from 'antd/lib/card';
import Icon from 'antd/lib/icon';

import TypeColors from '../../../modules/type-colors';
import withIsLoading from '../../components/hoc/with-is-loading';

import ResourceForm from '../Resources/ResourceFormModal';
import StatChar from '../../components/Charts/StatChar';
import Time from './Time';

const Column = Table.Column;

function ResourceTable({
  fetchTimestamp,
  data,
  tags,
  onTagClick,
  onCreateList,
  onToggleFavourite,
  onSaveResource,
}) {
  const [resourceIndex, setResourceIndex] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [dataCache, setDataCache] = useState(data);
  const [cacheTimestamp, setCacheTimestamp] = useState(new Date().getTime());
  const [sortedInfo, setSortedInfo] = useState({});

  useMemo(() => {
    setDataCache(data);
    setCacheTimestamp(new Date().getTime());
  }, [fetchTimestamp]);

  // rowSelection object indicates the need for row selection
  const rowSelection = {
    onChange: (selectedRowKeys, selectedRows) => {
      setSelectedItems(selectedRows);
    },
  };

  const handleResourceClose = () => {
    setResourceIndex(null);
  };

  const handleCreateList = () => {
    const tags = [];
    const resources = [];

    selectedItems.forEach(s => {
      tags.push(...s.resource.tags);
      resources.push(s.resource._id);
    });

    onCreateList({
      name: `Resources ${moment().format('MMMM Do YYYY, hh:mm:ss')}`,
      tags: [...new Set(tags)],
      resources,
    });
  };

  const handleResourceEdit = (id, resource, index) => {
    setResourceIndex(index);
  };

  const handleSaveResource = (resource, callback) => {
    setDataCache([
      ...dataCache.slice(0, resourceIndex),
      { ...dataCache[resourceIndex], resource },
      ...dataCache.slice(resourceIndex + 1),
    ]);
    setCacheTimestamp(new Date().getTime());
    onSaveResource(resource, callback);
  };

  const handleToggleFavourite = (record, index) => {
    setDataCache([
      ...dataCache.slice(0, index),
      { ...record, isFavourite: !record.isFavourite },
      ...dataCache.slice(index + 1),
    ]);
    setCacheTimestamp(new Date().getTime());
    onToggleFavourite(record.resource._id);
  };

  const handleTableChange = (pagination, filters, sorter) => {
    const { columnKey, order } = sorter;
    setSortedInfo({
      columnKey,
      order,
    });
    setCacheTimestamp(new Date().getTime());
  };

  const handleResultClick = result => {
    if (typeof result !== 'undefined') {
      onTagClick(`result:${result ? 'correct' : 'failed'}`);
    }
  };

  return (
    <Card style={{ marginBottom: 24 }} bordered={false}>
      <Row>
        <Col span={12}>{`${selectedItems.length} resources selected`}</Col>
        <Col span={12} style={{ textAlign: 'right' }}>
          <Button
            icon="play-circle"
            type="primary"
            disabled={selectedItems.length == 0}
            onClick={handleCreateList}
          >
            Play selected
          </Button>
        </Col>
      </Row>

      <Row style={{ marginTop: 12 }}>
        <Col span={24}>
          {useMemo(
            () => (
              <Table
                rowKey="_id"
                pagination={{ pageSize: 50 }}
                dataSource={dataCache}
                rowSelection={rowSelection}
                onChange={handleTableChange}
              >
                <Column
                  width={60}
                  dataIndex="lastExec"
                  render={date => <Time time={date} />}
                />
                <Column
                  dataIndex="isFavourite"
                  width={40}
                  render={(isFavourite, record, index) => (
                    <Icon
                      onClick={() => handleToggleFavourite(record, index)}
                      type="star"
                      theme="filled"
                      style={{
                        fontSize: 22,
                        float: 'right',
                        cursor: 'pointer',
                        color: isFavourite ? '#fadb14' : '#e8e8e8',
                      }}
                    />
                  )}
                />
                <Column
                  title="Resource"
                  dataIndex="resource.type"
                  render={(text, record) => (
                    <div>
                      <div>{record.resource.info.en.text}</div>
                      <div style={{ marginTop: 5 }}>
                        <Tag
                          key={text}
                          color={TypeColors[text]}
                          style={{ cursor: 'pointer' }}
                          onClick={() => onTagClick(`type:${text}`)}
                        >
                          {text.toUpperCase()}
                        </Tag>
                        {record.tags.map(tag => (
                          <Tag
                            key={tag}
                            style={{ cursor: 'pointer' }}
                            onClick={() => onTagClick(tag)}
                          >
                            {tag}
                          </Tag>
                        ))}
                      </div>
                    </div>
                  )}
                />
                <Column
                  title="Result"
                  dataIndex="lastResult"
                  width={60}
                  render={result => (
                    <Tag
                      color={
                        typeof result == 'undefined'
                          ? '#ccc'
                          : result
                          ? 'green'
                          : 'red'
                      }
                      onClick={() => handleResultClick(result)}
                      style={{ cursor: 'pointer' }}
                    >
                      {typeof result == 'undefined'
                        ? 'None'
                        : result
                        ? 'Correct'
                        : 'Failed'}
                    </Tag>
                  )}
                />
                <Column
                  title="Errors"
                  dataIndex="incorrect"
                  width={60}
                  sorter={(a, b) => a.incorrect - b.incorrect}
                  sortOrder={
                    sortedInfo.columnKey === 'incorrect' && sortedInfo.order
                  }
                  render={(_, { correct, incorrect, executions }) => (
                    <StatChar stats={{ correct, incorrect, executions }} />
                  )}
                />
                <Column
                  title=""
                  dataIndex="_id"
                  width={60}
                  render={(id, record, index) => (
                    <Button
                      icon="edit"
                      onClick={() => handleResourceEdit(id, record, index)}
                    />
                  )}
                />
              </Table>
            ),
            [fetchTimestamp, cacheTimestamp],
          )}
        </Col>
      </Row>
      {resourceIndex != null && (
        <ResourceForm
          data={data.map(d => d.resource)}
          index={resourceIndex}
          autocompleteTags={tags}
          onSave={handleSaveResource}
          onClose={handleResourceClose}
        />
      )}
    </Card>
  );
}

export default withIsLoading(ResourceTable);
