import React, { useState } from 'react';

import Table from 'antd/lib/table';
import Tag from 'antd/lib/tag';
import Row from 'antd/lib/row';
import Col from 'antd/lib/col';
import Button from 'antd/lib/button';
import Card from 'antd/lib/card';

import TypeColors from '../../../modules/type-colors';
import withIsLoading from '../../components/hoc/with-is-loading';

const Column = Table.Column;

function ResourceTable({
  data,
  onTypeClick,
  onTagClick,
  onEditClick,
  onCreateList,
}) {
  const [selectedItems, setSelectedItems] = useState([]);

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
            dataSource={data}
          >
            <Column
              title="Type"
              dataIndex="type"
              width={130}
              render={text => (
                <Tag
                  key={text}
                  color={TypeColors[text]}
                  style={{ cursor: 'pointer' }}
                  onClick={() => onTypeClick(text)}
                >
                  {text.toUpperCase()}
                </Tag>
              )}
            />
            <Column
              title="Resource"
              dataIndex="info.es.text"
              render={(text, record) => (
                <div>
                  <div>{text}</div>
                  <div style={{ marginTop: 5 }}>
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
              title=""
              dataIndex="_id"
              width={60}
              render={(id, record, index) => (
                <Button
                  icon="edit"
                  onClick={() => onEditClick(id, record, index)}
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
