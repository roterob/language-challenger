import React, { PureComponent, Suspense } from 'react';
import classNames from 'classnames';
import { Link } from 'react-router-dom';
import Layout from 'antd/lib/layout';
import PageLoading from '../PageLoading';
import styles from './index.less';
import { title } from '../../../../defaultSettings';

const BaseMenu = React.lazy(() => import('./BaseMenu'));
const { Sider } = Layout;

let firstMount = true;

export default class SiderMenu extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      openKeys: [],
    };
  }

  componentDidMount() {
    firstMount = false;
  }

  handleOpenChange = openKeys => {};

  render() {
    const {
      logo,
      collapsed,
      onCollapse,
      fixSiderbar,
      theme,
      isMobile,
    } = this.props;

    const siderClassName = classNames(styles.sider, {
      [styles.fixSiderBar]: fixSiderbar,
      [styles.light]: theme === 'light',
    });

    return (
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        breakpoint="lg"
        onCollapse={collapse => {
          if (firstMount || !isMobile) {
            onCollapse(collapse);
          }
        }}
        width={256}
        theme={theme}
        className={siderClassName}
      >
        <div className={styles.logo} id="logo">
          <Link to="/">
            <img src={logo} alt="logo" />
            <h1>{title}</h1>
          </Link>
        </div>
        <Suspense fallback={<PageLoading />}>
          <BaseMenu
            {...this.props}
            mode="inline"
            handleOpenChange={this.handleOpenChange}
            onOpenChange={this.handleOpenChange}
            style={{ padding: '16px 0', width: '100%' }}
          />
        </Suspense>
      </Sider>
    );
  }
}
