import React from 'react';
import Menu from 'antd/lib/menu';
import Avatar from 'antd/lib/avatar';
import Icon from 'antd/lib/icon';

import HeaderDropdown from '../HeaderDropdown';
import styles from './index.less';

export default function RightContent({ context, theme, onMenuClick }) {
  const { user } = context;

  const menu = (
    <Menu className={styles.menu} selectedKeys={[]} onClick={onMenuClick}>
      <Menu.Item key="userinfo">
        <Icon type="setting" />
        Account settings
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item key="users.logout">
        <Icon type="logout" />
        Lotout
      </Menu.Item>
    </Menu>
  );

  return (
    <div className={styles.right}>
      {user && user.name && (
        <HeaderDropdown overlay={menu}>
          <span className={`${styles.action} ${styles.account}`}>
            <Avatar
              size="small"
              className={styles.avatar}
              src={user.avatar}
              alt="avatar"
            />
            <span className={styles.name}>{user.name}</span>
          </span>
        </HeaderDropdown>
      )}
    </div>
  );
}
