import React from 'react';
import PropTypes from 'prop-types';

import Form from 'antd/lib/form';
import Icon from 'antd/lib/icon';
import Input from 'antd/lib/input';
import Button from 'antd/lib/button';
import Checkbox from 'antd/lib/checkbox';
import Alert from 'antd/lib/alert';

import styles from './index.less';

class Login extends React.Component {
  state = { message: '' };

  handleSubmitResult = error => {
    if (error) {
      this.setState({ message: error.reason || error });
    }
  };

  handleSubmit = e => {
    e.preventDefault();

    const {
      form: { validateFields },
      onSubmit,
    } = this.props;

    validateFields((err, values) => {
      if (!err) {
        onSubmit(values, this.handleSubmitResult);
      }
    });
  };

  render() {
    const {
      form: { getFieldDecorator },
    } = this.props;
    const { message } = this.state;

    return (
      <div className={styles['login-container']}>
        <div className="login-layout-lang" />
        <div className="login-layout-content">
          <div className="login-layout-top">
            <div className="login-layout-top-header">
              <a href="/">
                <img alt="logo" className="login-layout-logo" src="/logo.svg" />
                <span className="login-layout-title">Lenguage Challenge</span>
              </a>
            </div>
            <div className="login-layout-desc">The easiest mode of learn</div>
          </div>
          <Form onSubmit={this.handleSubmit} className="login-form">
            {message && (
              <Alert
                message="Error"
                description={message}
                type="error"
                showIcon
              />
            )}
            <Form.Item>
              {getFieldDecorator('userName', {
                rules: [
                  { required: true, message: 'Please input your username!' },
                ],
              })(
                <Input
                  prefix={
                    <Icon type="user" style={{ color: 'rgba(0,0,0,.25)' }} />
                  }
                  placeholder="Username"
                  size="large"
                />,
              )}
            </Form.Item>
            <Form.Item>
              {getFieldDecorator('password', {
                rules: [
                  { required: true, message: 'Please input your Password!' },
                ],
              })(
                <Input
                  prefix={
                    <Icon type="lock" style={{ color: 'rgba(0,0,0,.25)' }} />
                  }
                  type="password"
                  placeholder="Password"
                  size="large"
                />,
              )}
            </Form.Item>
            <Form.Item>
              {getFieldDecorator('remember', {
                valuePropName: 'checked',
                initialValue: true,
              })(<Checkbox>Remember me</Checkbox>)}
              <a className="login-form-forgot" href="">
                Forgot password
              </a>
              <br />
              <Button
                type="primary"
                htmlType="submit"
                className="login-form-button"
                size="large"
              >
                Log in
              </Button>
            </Form.Item>
          </Form>
        </div>
      </div>
    );
  }
}

Login.propTypes = {
  form: PropTypes.object.isRequired,
  onSubmit: PropTypes.func,
};

Login.defaultProps = {
  onSubmit: () => {},
};

export default Form.create({})(Login);
