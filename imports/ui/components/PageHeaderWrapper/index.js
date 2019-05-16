import React from 'react';
import PageHeader from 'antd/lib/page-header';
import Tabs from 'antd/lib/tabs';
import Typography from 'antd/lib/typography';
import { Link } from 'react-router-dom';
import classNames from 'classnames';
import GridContent from './GridContent';

import styles from './index.less';

const { Title } = Typography;

/**
 * render Footer tabList
 * In order to be compatible with the old version of the PageHeader
 * basically all the functions are implemented.
 */
const renderFooter = ({
  tabList,
  tabActiveKey,
  onTabChange,
  tabBarExtraContent,
}) => {
  return tabList && tabList.length ? (
    <Tabs
      className={styles.tabs}
      activeKey={tabActiveKey}
      onChange={key => {
        if (onTabChange) {
          onTabChange(key);
        }
      }}
      tabBarExtraContent={tabBarExtraContent}
    >
      {tabList.map(item => (
        <Tabs.TabPane tab={item.tab} key={item.key} />
      ))}
    </Tabs>
  ) : null;
};

const PageHeaderWrapper = ({
  children,
  contentWidth,
  wrapperClassName,
  top,
  title,
  content,
  logo,
  extraContent,
  hiddenBreadcrumb,
  ...restProps
}) => {
  return (
    <div
      style={{ margin: '-24px -24px 0' }}
      className={classNames(wrapperClassName, styles.main)}
    >
      {top}
      <PageHeader
        wide={contentWidth === 'Fixed'}
        title={
          <Title
            level={4}
            style={{
              marginBottom: 0,
            }}
          >
            {title}
          </Title>
        }
        key="pageheader"
        {...restProps}
        breadcrumb={{}}
        linkElement={Link}
        footer={renderFooter(restProps)}
      >
        <div className={styles.detail}>
          {logo && <div className={styles.logo}>{logo}</div>}
          <div className={styles.main}>
            <div className={styles.row}>
              {content && <div className={styles.content}>{content}</div>}
              {extraContent && (
                <div className={styles.extraContent}>{extraContent}</div>
              )}
            </div>
          </div>
        </div>
      </PageHeader>
      {children ? (
        <div className={styles['children-content']}>
          <GridContent>{children}</GridContent>
        </div>
      ) : null}
    </div>
  );
};

export default PageHeaderWrapper;
