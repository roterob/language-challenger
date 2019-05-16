---
to: imports/ui/pages/<%=name%>/<%=name%>.js
---

import React, { useState, useMemo } from 'react';
import classNames from 'classnames';

import Row from 'antd/lib/row';
import Col from 'antd/lib/col';
import Avatar from 'antd/lib/avatar';
import Sping from 'antd/lib/spin';
import Card from 'antd/lib/card';

import PageHeaderWrapper from '../../components/PageHeaderWrapper';

<% if (withFilters) { %>
import SearchTagBar from '../../components/SearchTagBar/SearchTagBar';
<% } %>
import styles from '../index.less';

function Resources({
  isLoading,
  data,
  fetchTimestamp,
  hasMore,
  dispatch,
<% if (withFilters) { %>
  filters,
  onDataQuery,
<% } %>
}) {

<% if (withFilters) { %>
  const handleSearchChange = ({ type, tags }) => {
    onDataQuery({ type, tags });
  };

  const { type, tags } = filters;
<% } %>

  const headerContent = (
    <div className={styles.pageHeaderContent}>
      <div className={styles.avatar}>
        <Avatar size={64} icon="<%= icon %>" />
      </div>
      <div className={styles.content}>
        <div className={styles.contentTitle}><%= title %></div>
<% if (withFilters) { %>
        <div>
          <SearchTagBar
            type={type}
            tags={tags}
            onChange={handleSearchChange}
            autocompleteTags={collectedTags}
          />
        </div>
<% } %>
      </div>
    </div>
  );

  const extraContent = isLoading ? (
    <Sping delay={500} />
  ) : (
    <div className={styles.extraContent}>
      <div className={styles.statItem}>
        <p>Count</p>
        <p className={classNames({ [styles.hasmore]: hasMore })}>
          {data.length}
        </p>
      </div>
    </div>
  );

  return (
    <PageHeaderWrapper content={headerContent} extraContent={extraContent}>
      <React.Fragment>
        <Row>
          <Col span={24}>
            <Card>
            TODO: Some content here
            </Card>
          </Col>
        </Row>
      </React.Fragment>
    </PageHeaderWrapper>
  );
}

export default Resources;
