import React, { Fragment } from 'react';
import Button from 'antd/lib/button';
import Icon from 'antd/lib/icon';
import Card from 'antd/lib/card';
import Result from '../components/Result';

const iconStyles = {
  marginRight: 8,
  color: '#52c41a',
};

const extra = (
  <Fragment>
    <div
      style={{
        fontSize: 16,
        color: 'rgba(0, 0, 0, 0.85)',
        fontWeight: '500',
        marginBottom: 16,
      }}
    >
      <span>For more information you can: </span>
    </div>
    <div style={{ marginBottom: 16 }}>
      <Icon style={iconStyles} type="check-circle-o" />
      Visit the meteor docs
      <a style={{ marginLeft: 16 }}>
        Go
        <Icon type="right" />
      </a>
    </div>
    <div>
      <Icon style={iconStyles} type="check-circle-o" />
      Visit the antd docs
      <a style={{ marginLeft: 16 }}>
        Go
        <Icon type="right" />
      </a>
    </div>
  </Fragment>
);

const actions = <Button type="primary">Return to modify</Button>;

export default () => (
  <Card bordered={false}>
    <Result
      type="success"
      title="The project has been created successfully"
      description="This is a scaffold project to start with Meteor and antd"
      extra={extra}
      actions={actions}
      style={{ marginTop: 48, marginBottom: 16 }}
    />
  </Card>
);
