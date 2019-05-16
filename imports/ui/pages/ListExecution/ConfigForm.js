import React from 'react';

import Form from 'antd/lib/form';
import FormItem from 'antd/lib/form/FormItem';
import Radio from 'antd/lib/radio';
import Switch from 'antd/lib/switch';
import Icon from 'antd/lib/icon';

import createFormField from '../../../modules/create-form-field';

class ConfigForm extends React.Component {
  render() {
    const { getFieldDecorator } = this.props.form;
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
              checkedChildren={<Icon type="check" />}
              unCheckedChildren={<Icon type="close" />}
            />,
          )}
        </FormItem>
        <FormItem label="Play answer?">
          {getFieldDecorator('playAnswer', { valuePropName: 'checked' })(
            <Switch
              checkedChildren={<Icon type="check" />}
              unCheckedChildren={<Icon type="close" />}
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
