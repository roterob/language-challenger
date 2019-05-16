import React, { PureComponent } from 'react';

import Row from 'antd/lib/row';
import Col from 'antd/lib/col';
import Card from 'antd/lib/card';
import Avatar from 'antd/lib/avatar';

import { withAppContext } from '../../contexts/AppGlobalContext';
import PageHeaderWrapper from '../../components/PageHeaderWrapper';
import AreaChart from '../../components/Charts/Area';

import styles from '../index.less';

class Workplace extends PureComponent {
  render() {
    const {
      context: { user: currentUser },
    } = this.props;

    const pageHeaderContent =
      currentUser && Object.keys(currentUser).length ? (
        <div className={styles.pageHeaderContent}>
          <div className={styles.avatar}>
            <Avatar size="large" src={currentUser.avatar} />
          </div>
          <div className={styles.content}>
            <div className={styles.contentTitle}>
              Hi，
              {currentUser.name}
              ，wellcome！
            </div>
            <div>Last login on 23/04/2019</div>
          </div>
        </div>
      ) : null;

    const extraContent = (
      <div className={styles.extraContent}>
        <div className={styles.statItem}>
          <p>Completed</p>
          <p>56</p>
        </div>
        <div className={styles.statItem}>
          <p>Success</p>
          <p>
            8<span> / 24</span>
          </p>
        </div>
        <div className={styles.statItem}>
          <p>Score</p>
          <p>2,223</p>
        </div>
      </div>
    );

    return (
      <PageHeaderWrapper
        content={pageHeaderContent}
        extraContent={extraContent}
      >
        <Row gutter={24}>
          <Col xl={8} lg={24} md={24} sm={24} xs={24}>
            <Card
              style={{ marginBottom: 24 }}
              bordered={false}
              title="Success / Errors"
            >
              <div style={{ textAlign: 'center' }}>
                <AreaChart />
              </div>
            </Card>
          </Col>
        </Row>
      </PageHeaderWrapper>
    );
  }
}

export default withAppContext(Workplace);
