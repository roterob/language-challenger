import React from 'react';
import Drawer from 'antd/lib/drawer';
import SiderMenu from './SiderMenu';

const SiderMenuWrapper = React.memo(props => {
  const { isMobile, menuData, collapsed, onCollapse } = props;
  return isMobile ? (
    <Drawer
      visible={!collapsed}
      placement="left"
      onClose={() => onCollapse(true)}
      style={{
        padding: 0,
        height: '100vh',
      }}
    >
      <SiderMenu
        {...props}
        menuData={menuData}
        collapsed={isMobile ? false : collapsed}
      />
    </Drawer>
  ) : (
    <SiderMenu {...props} flatMenuKeys={[]} />
  );
});

export default SiderMenuWrapper;
