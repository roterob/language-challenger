import React from 'react';

import Form from 'antd/lib/form';
import FormItem from 'antd/lib/form/FormItem';
import Select from 'antd/lib/select';

import createFormField from '../../../modules/create-form-field';
import TagInput from '../../components/SearchTagBar';
import InfoInput from './InfoInput';
import fixFormWarning from '../../components/fix-form-warning';

import settings from '../../../../defaultSettings';

const FixedTagInput = fixFormWarning(TagInput);
const { formItemLayout } = settings;

class ResourceForm extends React.Component {
  validateInfo(rule, info, callback) {
    let message = '';
    Object.keys(info).forEach(lang => {
      if (!info[lang].text || !info[lang].audio) {
        message = 'All fields are required';
      }
    });

    if (message) {
      callback(message);
    } else {
      callback();
    }
  }

  render() {
    const {
      form: { getFieldDecorator },
      autocompleteTags,
    } = this.props;

    return (
      <Form>
        <FormItem {...formItemLayout} label="Type">
          {getFieldDecorator('type', {
            rules: [{ required: true, message: 'Type is required' }],
          })(
            <Select placeholder="type" style={{ width: 120 }} allowClear>
              <Select.Option value="phrase">Phrase</Select.Option>
              <Select.Option value="vocabulary">Vocabulary</Select.Option>
              <Select.Option value="paragraph">Paragraph</Select.Option>
            </Select>,
          )}
        </FormItem>
        <FormItem {...formItemLayout} label="Tags">
          {getFieldDecorator('tags', { valuePropName: 'tags' })(
            <FixedTagInput
              size="default"
              autocompleteTags={autocompleteTags || []}
            />,
          )}
        </FormItem>
        <FormItem {...formItemLayout} label="Info">
          {getFieldDecorator('info', {
            rules: [{ validator: this.validateInfo }],
          })(<InfoInput />)}
        </FormItem>
      </Form>
    );
  }
}

export default Form.create({
  mapPropsToFields: ({ autocompleteTags, ...props }) => createFormField(props),
})(ResourceForm);
