import React from 'react';

import LocaleProvider from 'antd/lib/locale-provider';
import DatePicker from 'antd/lib/date-picker';
import message from 'antd/lib/message';
import Row from 'antd/lib/row';
import Col from 'antd/lib/col';
import Card from 'antd/lib/card';

import esES from 'antd/lib/locale-provider/es_ES';

class Page1 extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      date: '',
    };
  }
  handleChange(date) {
    message.info(`Selected Date: ${date ? date.toString() : ''}`);
    this.setState({ date });
  }
  render() {
    return (
      <Row gutter={24}>
        <Col xl={8} lg={24} md={24} sm={24} xs={24}>
          <Card style={{ marginBottom: 24 }} bordered={false}>
            <LocaleProvider locale={esES}>
              <div style={{ width: 400, margin: '100px auto' }}>
                <DatePicker onChange={value => this.handleChange(value)} />
                <div style={{ marginTop: 20 }}>
                  Fecha: {this.state.date && this.state.date.toString()}
                </div>
              </div>
            </LocaleProvider>
          </Card>
        </Col>
      </Row>
    );
  }
}

export default Page1;
