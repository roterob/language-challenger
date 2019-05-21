import React, { useState } from 'react';

import Table from 'antd/lib/table';
import Tag from 'antd/lib/tag';
import Row from 'antd/lib/row';
import Col from 'antd/lib/col';
import Button from 'antd/lib/button';
import ButtonGroup from 'antd/lib/button/button-group';
import Card from 'antd/lib/card';

import withIsLoading from '../../components/hoc/with-is-loading';
import StatChar from '../../components/Charts/StatChar';
import Time from './Time';

const Column = Table.Column;

function ExecutionsTable({ data, onTagClick, onStartList, onReviewList }) {
  const [executionId, setExecutionId] = useState(null);
  const handleStartList = (execId, listId) => {
    setExecutionId(execId);
    onStartList(listId, () => setExecutionId(null));
  };
  return (
    <Card style={{ marginBottom: 24 }} bordered={false}>
      <Row style={{ marginTop: 12 }}>
        <Col span={24}>
          <Table rowKey="_id" pagination={{ pageSize: 50 }} dataSource={data}>
            <Column
              width={60}
              dataIndex="updatedAt"
              render={date => <Time time={date} />}
            />
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
              dataIndex="counts"
              width={60}
              render={(counts, record) =>
                record.inProgress ? (
                  <Tag color="red">In progress</Tag>
                ) : (
                  <StatChar stats={counts} />
                )
              }
            />
            <Column
              title=""
              dataIndex="_id"
              width={150}
              render={(id, record, index) => (
                <ButtonGroup>
                  <Button
                    key="play"
                    icon="play-circle"
                    loading={id == executionId}
                    onClick={() => handleStartList(id, record.listId)}
                  >
                    Start
                  </Button>
                  {!record.inProgress && (
                    <Button
                      key="review"
                      icon="eye"
                      onClick={() => onReviewList(id)}
                    />
                  )}
                </ButtonGroup>
              )}
            />
          </Table>
        </Col>
      </Row>
    </Card>
  );
}

export default withIsLoading(ExecutionsTable);
