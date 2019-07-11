import React, { useState } from 'react';

import Table from 'antd/lib/table';
import Tag from 'antd/lib/tag';
import Row from 'antd/lib/row';
import Col from 'antd/lib/col';
import Button from 'antd/lib/button';
import Card from 'antd/lib/card';
import ButtonGroup from 'antd/lib/button/button-group';

import withIsLoading from '../../components/hoc/with-is-loading';
import StatChar from '../../components/Charts/StatChar';

const Column = Table.Column;

function ListTable({ data, onTagClick, onEditClick, onStartList }) {
  const [startListId, setStartListId] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);

  const handleStartList = id => {
    setStartListId(id);
    onStartList(id, () => setStartListId(null));
  };

  const handleRowSelection = {
    onChange: (selectedRowKeys, selectedRows) => {
      setSelectedItems(selectedRows);
    },
  };

  const handleExecuteLists = () => {
    const ids = selectedItems.map(i => i._id);
    setStartListId('0');
    onStartList(ids, () => setStartListId(null));
  };

  return (
    <Card style={{ marginBottom: 24 }} bordered={false}>
      <Row>
        <Col span={12}>{`${selectedItems.length} lists selected`}</Col>
        <Col span={12} style={{ textAlign: 'right' }}>
          <Button
            type="primary"
            disabled={selectedItems.length == 0}
            onClick={handleExecuteLists}
            loading={startListId === '0'}
          >
            Execute lists
          </Button>
        </Col>
      </Row>
      <Row style={{ marginTop: 12 }}>
        <Col span={24}>
          <Table
            rowKey="_id"
            pagination={{ pageSize: 50 }}
            rowSelection={handleRowSelection}
            dataSource={data}
          >
            <Column
              title="List"
              dataIndex="name"
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
              title="Stats"
              dataIndex="stats"
              width={60}
              render={stats => <StatChar stats={stats} />}
            />
            <Column
              title=""
              dataIndex="_id"
              width={150}
              render={(id, record, index) => (
                <ButtonGroup>
                  <Button
                    icon="play-circle"
                    loading={id == startListId}
                    onClick={() => handleStartList(id)}
                  >
                    Start
                  </Button>
                  <Button
                    icon="edit"
                    onClick={() => onEditClick(id, record, index)}
                  />
                </ButtonGroup>
              )}
            />
          </Table>
        </Col>
      </Row>
    </Card>
  );
}

export default withIsLoading(ListTable);
