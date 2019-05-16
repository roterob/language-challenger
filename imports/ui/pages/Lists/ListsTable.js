import React from 'react';

import Table from 'antd/lib/table';
import Tag from 'antd/lib/tag';
import Row from 'antd/lib/row';
import Col from 'antd/lib/col';
import Button from 'antd/lib/button';
import Card from 'antd/lib/card';
import ButtonGroup from 'antd/lib/button/button-group';

import withIsLoading from '../../components/hoc/with-is-loading';
import StatChar from './StatChar';

const Column = Table.Column;

function ListTable({ data, onTagClick, onEditClick }) {
  return (
    <Card style={{ marginBottom: 24 }} bordered={false}>
      <Row style={{ marginTop: 12 }}>
        <Col span={24}>
          <Table rowKey="_id" pagination={{ pageSize: 50 }} dataSource={data}>
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
                  <Button icon="play-circle">Start</Button>
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
