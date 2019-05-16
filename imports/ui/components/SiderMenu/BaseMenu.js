import React, { PureComponent } from 'react';
import classNames from 'classnames';
import { Link } from 'react-router-dom';
import Menu from 'antd/lib/menu';
import Icon from 'antd/lib/icon';

const { SubMenu } = Menu;

export default class BaseMenu extends PureComponent {
  getNavMenuItems = menusData => {
    if (!menusData) {
      return [];
    }
    return menusData
      .filter(item => item.name && !item.hideInMenu)
      .map(item => this.getSubMenuOrItem(item))
      .filter(item => item);
  };

  /**
   * get SubMenu or Item
   */
  getSubMenuOrItem = item => {
    // doc: add hideChildrenInMenu
    if (
      item.children &&
      !item.hideChildrenInMenu &&
      item.children.some(child => child.name)
    ) {
      const { name } = item;
      return (
        <SubMenu
          title={
            item.icon ? (
              <span>
                <Icon type={item.icon} />
                <span>{name}</span>
              </span>
            ) : (
              name
            )
          }
          key={item.key}
        >
          {this.getNavMenuItems(item.children)}
        </SubMenu>
      );
    }
    return <Menu.Item key={item.key}>{this.getMenuItemPath(item)}</Menu.Item>;
  };

  getMenuItemPath = item => {
    const { key, icon, name, path } = item;
    const { location, isMobile, onCollapse } = this.props;
    return (
      <Link
        to={path}
        onClick={
          isMobile
            ? () => {
                onCollapse(true);
              }
            : undefined
        }
      >
        <Icon type={icon} />
        <span>{name}</span>
      </Link>
    );
  };

  conversionPath = path => {
    if (path && path.indexOf('http') === 0) {
      return path;
    }
    return `/${path || ''}`.replace(/\/+/g, '/');
  };

  getPopupContainer = (fixedHeader, layout) => {
    if (fixedHeader && layout === 'topmenu') {
      return this.wrap;
    }
    return document.body;
  };

  getSelectedKeys = (menuData, pathname) => {
    const res = [];
    if (pathname) {
      menuData.forEach(m => {
        if (pathname.indexOf(m.path) >= 0) {
          res.push(m.key);
        }
      });
    }
    return res;
  };

  getRef = ref => {
    this.wrap = ref;
  };

  render() {
    const {
      openKeys,
      theme,
      mode,
      location: { pathname },
      className,
      collapsed,
      fixedHeader,
      layout,
      location,
      menuData,
    } = this.props;

    // if pathname can't match, use the nearest parent's key
    let selectedKeys = this.getSelectedKeys(menuData, location.pathname);
    let props = {};
    if (openKeys && !collapsed) {
      props = {
        openKeys: openKeys.length === 0 ? [...selectedKeys] : openKeys,
      };
    }
    const { handleOpenChange, style } = this.props;
    const cls = classNames(className, {
      'top-nav-menu': mode === 'horizontal',
    });

    return (
      <>
        <Menu
          key="Menu"
          mode={mode}
          theme={theme}
          onOpenChange={handleOpenChange}
          selectedKeys={selectedKeys}
          style={style}
          className={cls}
          {...props}
          getPopupContainer={() => this.getPopupContainer(fixedHeader, layout)}
        >
          {this.getNavMenuItems(menuData)}
        </Menu>
        <div ref={this.getRef} />
      </>
    );
  }
}
