import React from 'react';
import PageHeaderWrapper from '../components/PageHeaderWrapper';

import Row from 'antd/lib/row';
import Col from 'antd/lib/col';
import Card from 'antd/lib/card';
import Avatar from 'antd/lib/avatar';

import SearchTagBar from '../components/SearchTagBar/SearchTagBar';
import styles from './index.less';

class Page2 extends React.Component {
  render() {
    const headerContent = (
      <div className={styles.pageHeaderContent}>
        <div className={styles.avatar}>
          <Avatar size={64} icon="database" />
        </div>
        <div className={styles.content}>
          <div className={styles.contentTitle}>Resources</div>
          <div>
            <SearchTagBar />
          </div>
        </div>
      </div>
    );
    const extraContent = (
      <div className={styles.extraContent}>
        <div className={styles.statItem}>
          <p>Total</p>
          <p>1432</p>
        </div>
      </div>
    );
    return (
      <PageHeaderWrapper content={headerContent} extraContent={extraContent}>
        <Row gutter={24}>
          <Col xl={8} lg={24} md={24} sm={24} xs={24}>
            <Card style={{ marginBottom: 24 }} bordered={false}>
              Page 2 in action
            </Card>
          </Col>
        </Row>
      </PageHeaderWrapper>
    );
  }
}

export default Page2;
