import React from 'react';

import Form from 'antd/lib/form';
import FormItem from 'antd/lib/form/FormItem';
import Input from 'antd/lib/input';

import createFormField from '../../../modules/create-form-field';
import TagInput from '../../components/SearchTagBar';
import fixFormWarning from '../../components/fix-form-warning';

import settings from '../../../../defaultSettings';

const FixedTagInput = fixFormWarning(TagInput);
const { formItemLayout } = settings;

class ListForm extends React.Component {
  render() {
    const {
      form: { getFieldDecorator },
      autocompleteTags,
      resources,
    } = this.props;

    return (
      <Form>
        <FormItem {...formItemLayout} label="Name">
          {getFieldDecorator('name', {
            rules: [{ required: true, message: 'Name is required' }],
          })(<Input style={{ width: 200 }} />)}
        </FormItem>
        <FormItem {...formItemLayout} label="Tags">
          {getFieldDecorator('tags', { valuePropName: 'tags' })(
            <FixedTagInput
              size="default"
              autocompleteTags={autocompleteTags || []}
            />,
          )}
        </FormItem>
        <FormItem {...formItemLayout} label="Items">
          {getFieldDecorator('resources', { valuePropName: 'resources' })(
            <span>{`${resources.length} resources`}</span>,
          )}
        </FormItem>
      </Form>
    );
  }
}

export default Form.create({
  mapPropsToFields: ({ autocompleteTags, ...props }) => createFormField(props),
})(ListForm);
