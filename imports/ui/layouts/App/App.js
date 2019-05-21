import React from 'react';
import PropTypes from 'prop-types';
import { Switch, Route } from 'react-router-dom';
import Media from 'react-media';
import { ContainerQuery } from 'react-container-query';
import classNames from 'classnames';
import Layout from 'antd/lib/layout';

import AppGlobalContext from '../../contexts/AppGlobalContext';
import SiderMenu from '../../components/SiderMenu';
import Header from '../Header';
import Footer from '../../components/Footer/Footer';
import Loading from '../../components/PageLoading';

const ResourcesPage = React.lazy(() => import('../../pages/Resources'));
const LoginPage = React.lazy(() => import('../../pages/login'));
const ExecutionsPage = React.lazy(() => import('../../pages/Executions'));
const ListsPage = React.lazy(() => import('../../pages/Lists'));

import styles from './index.less';

const logo = '/logo.svg';

const { Content } = Layout;

const query = {
  'screen-xs': {
    maxWidth: 575,
  },
  'screen-sm': {
    minWidth: 576,
    maxWidth: 767,
  },
  'screen-md': {
    minWidth: 768,
    maxWidth: 991,
  },
  'screen-lg': {
    minWidth: 992,
    maxWidth: 1199,
  },
  'screen-xl': {
    minWidth: 1200,
    maxWidth: 1599,
  },
  'screen-xxl': {
    minWidth: 1600,
  },
};

class App extends React.Component {
  static propTypes = {
    isLoading: PropTypes.bool.isRequired,
    isAuthenticated: PropTypes.bool.isRequired,
    context: PropTypes.object.isRequired,
    globalSettings: PropTypes.object.isRequired,
    location: PropTypes.object.isRequired,
    dispatch: PropTypes.func.isRequired,
  };

  getLayoutStyle = () => {
    const { fixSiderbar, isMobile, collapsed, layout } = this.props;
    if (fixSiderbar && layout !== 'topmenu' && !isMobile) {
      return {
        paddingLeft: collapsed ? '80px' : '256px',
      };
    }
    return null;
  };

  handleMenuCollapse = collapsed => {
    const {
      dispatch,
      context: {
        user: { uiSettings },
      },
    } = this.props;

    const newSettings = { ...uiSettings, collapsed };

    dispatch('users.updateUISettings', newSettings);
  };

  handleUserMenuClick = ({ key }) => {
    const { dispatch } = this.props;
    dispatch(key);
  };

  getLayout() {
    const { context, globalSettings, location, isMobile } = this.props;

    const {
      user: { uiSettings },
    } = context;

    const { navTheme, layout: PropsLayout, fixedHeader } = globalSettings;

    const { collapsed } = uiSettings;

    const isTop = PropsLayout === 'topmenu';
    const contentStyle = !fixedHeader ? { paddingTop: 0 } : {};

    return (
      <Layout>
        {isTop && !isMobile ? null : (
          <SiderMenu
            logo={logo}
            theme={navTheme}
            onCollapse={this.handleMenuCollapse}
            isMobile={isMobile}
            collapsed={collapsed}
            location={location}
            {...globalSettings}
          />
        )}
        <Layout
          style={{
            ...this.getLayoutStyle(),
            minHeight: '100vh',
          }}
        >
          <Header
            menuData={[]}
            handleMenuCollapse={this.handleMenuCollapse}
            logo={logo}
            isMobile={isMobile}
            theme={navTheme}
            collapsed={collapsed}
            context={context}
            onMenuClick={this.handleUserMenuClick}
            {...globalSettings}
          />
          <Content className={styles.content} style={contentStyle}>
            <React.Suspense fallback={<Loading />}>
              <Switch>
                <Route exact path="/" render={() => <ExecutionsPage />} />
                <Route
                  exact
                  path="/Resources"
                  render={() => <ResourcesPage />}
                />
                <Route exact path="/Lists" render={() => <ListsPage />} />
                <Route
                  exact
                  path="/Executions"
                  render={() => <ExecutionsPage />}
                />
              </Switch>
            </React.Suspense>
          </Content>
          <Footer />
        </Layout>
      </Layout>
    );
  }

  render() {
    const { isAuthenticated, isLoading, context } = this.props;

    return !isAuthenticated ? (
      <React.Suspense fallback={<Loading />}>
        <LoginPage />
      </React.Suspense>
    ) : isLoading ? (
      <Loading />
    ) : (
      <AppGlobalContext.Provider value={context}>
        <ContainerQuery query={query}>
          {params => (
            <div className={classNames(params)}>{this.getLayout()}</div>
          )}
        </ContainerQuery>
      </AppGlobalContext.Provider>
    );
  }
}

export default props => (
  <Media query="(max-width: 599px)">
    {isMobile => <App {...props} isMobile={isMobile} />}
  </Media>
);
