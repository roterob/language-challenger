import React from 'react';
import Layout from 'antd/lib/layout';
import Menu from 'antd/lib/menu';
import Icon from 'antd/lib/icon';
import { Link } from 'react-router-dom';

const { Sider } = Layout;
const { SubMenu } = Menu;

class Sidebar extends React.Component {
  constructor(props) {
    super(props);
    this.state = { menuCollapsed: false };

    this.onCollapse = this.onCollapse.bind(this);
  }
  onCollapse(collapsed) {
    this.setState({ menuCollapsed: collapsed });
  }
  render() {
    const { history } = this.props;
    return (
      <Sider
        collapsible
        collapsed={this.state.menuCollapsed}
        onCollapse={this.onCollapse}
      >
        <div className="logo" />
        <Menu theme="dark" defaultSelectedKeys={['1']} mode="inline">
          <Menu.Item key="1">
            <Link to="/Page1">
              <Icon type="pie-chart" />
              <span>Page 1</span>
            </Link>
          </Menu.Item>
          <Menu.Item key="2">
            <Link to="/Page2">
              <Icon type="desktop" />
              <span>Page 2</span>
            </Link>
          </Menu.Item>
          <SubMenu
            key="sub1"
            title={
              <span>
                <Icon type="user" />
                <span>User</span>
              </span>
            }
          >
            <Menu.Item key="3">Tom</Menu.Item>
            <Menu.Item key="4">Bill</Menu.Item>
            <Menu.Item key="5">Alex</Menu.Item>
          </SubMenu>
          <SubMenu
            key="sub2"
            title={
              <span>
                <Icon type="team" />
                <span>Team</span>
              </span>
            }
          >
            <Menu.Item key="6">Team 1</Menu.Item>
            <Menu.Item key="8">Team 2</Menu.Item>
          </SubMenu>
          <Menu.Item key="9">
            <Icon type="file" />
            <span>File</span>
          </Menu.Item>
        </Menu>
      </Sider>
    );
  }
}

export default Sidebar;
