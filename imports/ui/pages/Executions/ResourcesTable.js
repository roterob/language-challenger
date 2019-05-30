import React, { useState, useMemo } from 'react';

import Table from 'antd/lib/table';
import Tag from 'antd/lib/tag';
import Row from 'antd/lib/row';
import Col from 'antd/lib/col';
import Button from 'antd/lib/button';
import Card from 'antd/lib/card';
import Icon from 'antd/lib/icon';

import TypeColors from '../../../modules/type-colors';
import withIsLoading from '../../components/hoc/with-is-loading';

import StatChar from '../../components/Charts/StatChar';
import Time from './Time';

const Column = Table.Column;

function ResourceTable({
  fetchTimestamp,
  data,
  onTagClick,
  onEditClick,
  onCreateList,
  onToggleFavourite,
}) {
  const [selectedItems, setSelectedItems] = useState([]);
  const [dataCache, setDataCache] = useState(data);

  useMemo(() => {
    setDataCache(data);
  }, [fetchTimestamp]);

  // rowSelection object indicates the need for row selection
  const rowSelection = {
    onChange: (selectedRowKeys, selectedRows) => {
      setSelectedItems(selectedRows);
    },
    getCheckboxProps: record => ({
      disabled: record.name === 'Disabled User', // Column configuration not to be checked
      name: record.name,
    }),
  };

  const handleCreateList = () => {
    const tags = [];
    selectedItems.forEach(i => tags.push(...i.tags));

    onCreateList({
      name: '',
      tags: [...new Set(tags)],
      resources: selectedItems,
    });
  };

  const handleToggleFavourite = (record, index) => {
    setDataCache([
      ...dataCache.slice(0, index),
      { ...record, isFavourite: !record.isFavourite },
      ...dataCache.slice(index + 1),
    ]);
    onToggleFavourite(record.resource._id);
  };

  return (
    <Card style={{ marginBottom: 24 }} bordered={false}>
      <Row>
        <Col span={12}>{`${selectedItems.length} resources selected`}</Col>
        <Col span={12} style={{ textAlign: 'right' }}>
          <Button
            type="primary"
            disabled={selectedItems.length == 0}
            onClick={handleCreateList}
          >
            Create list
          </Button>
        </Col>
      </Row>

      <Row style={{ marginTop: 12 }}>
        <Col span={24}>
          <Table
            rowKey="_id"
            pagination={{ pageSize: 50 }}
            rowSelection={rowSelection}
            dataSource={dataCache}
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
              title="Errors"
              width={60}
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
                  onClick={() => onEditClick(id, record.resource, index)}
                />
              )}
            />
          </Table>
        </Col>
      </Row>
    </Card>
  );
}

export default withIsLoading(ResourceTable);
