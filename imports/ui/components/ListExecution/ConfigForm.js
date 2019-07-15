import React from 'react';

import Form from 'antd/lib/form';
import FormItem from 'antd/lib/form/FormItem';
import Radio from 'antd/lib/radio';
import Switch from 'antd/lib/switch';
import Icon from 'antd/lib/icon';
import Divider from 'antd/lib/divider';

import createFormField from '../../../modules/create-form-field';

class ConfigForm extends React.Component {
  handleAutomaticCheckChange = current => {
    const { getFieldsValue, setFieldsValue } = this.props.form;
    const { playQuestion, playAnswer } = getFieldsValue();
    if (current && !playAnswer && !playQuestion) {
      setFieldsValue({ playQuestion: true, playAnswer: true });
    } else if (!current) {
      setFieldsValue({ loopMode: false });
    }
  };

  handlePlayCheckChange = (field, current) => {
    const { getFieldsValue, setFieldsValue } = this.props.form;
    const { playAnswer, playQuestion } = {
      ...getFieldsValue(),
      [field]: current,
    };
    if (!playAnswer && !playQuestion) {
      setFieldsValue({ automaticMode: false });
    }
  };

  render() {
    const { getFieldDecorator, getFieldsValue } = this.props.form;
    const { automaticMode, loopMode } = this.props;
    const formItemLayout = {
      labelCol: { xs: { span: 12 } },
      wrapperCol: { xs: { span: 12 } },
    };
    return (
      <Form {...formItemLayout}>
        <FormItem label="Question lang">
          {getFieldDecorator('questionLang', {})(
            <Radio.Group buttonStyle="solid">
              <Radio.Button value="en">EN</Radio.Button>
              <Radio.Button value="es">ES</Radio.Button>
            </Radio.Group>,
          )}
        </FormItem>
        <FormItem label="Play question?">
          {getFieldDecorator('playQuestion', { valuePropName: 'checked' })(
            <Switch
              onChange={v => this.handlePlayCheckChange('playQuestion', v)}
              checkedChildren={<Icon type="check" />}
              unCheckedChildren={<Icon type="close" />}
            />,
          )}
        </FormItem>
        <FormItem label="Play answer?">
          {getFieldDecorator('playAnswer', { valuePropName: 'checked' })(
            <Switch
              onChange={v => this.handlePlayCheckChange('playAnswer', v)}
              checkedChildren={<Icon type="check" />}
              unCheckedChildren={<Icon type="close" />}
            />,
          )}
        </FormItem>
        <FormItem label="Write answer?">
          {getFieldDecorator('writeAnswer', {
            valuePropName: 'checked',
            initialValue: false,
          })(
            <Switch
              checkedChildren={<Icon type="check" />}
              unCheckedChildren={<Icon type="close" />}
            />,
          )}
        </FormItem>
        <Divider dashed />
        <FormItem label="Automatic mode?">
          {getFieldDecorator('automaticMode', { valuePropName: 'checked' })(
            <Switch
              onChange={this.handleAutomaticCheckChange}
              checkedChildren={<Icon type="check" />}
              unCheckedChildren={<Icon type="close" />}
            />,
          )}
        </FormItem>
        <FormItem label="Loop mode?">
          {getFieldDecorator('loopMode', {
            valuePropName: 'checked',
          })(
            <Switch
              checkedChildren={<Icon type="check" />}
              unCheckedChildren={<Icon type="close" />}
              disabled={!automaticMode}
            />,
          )}
        </FormItem>
      </Form>
    );
  }
}

export default Form.create({
  mapPropsToFields: props => createFormField(props),
})(ConfigForm);
