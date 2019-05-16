import Form from 'antd/lib/form';

export default values => {
  const res = {};

  Object.keys(values).forEach(
    k => (res[k] = Form.createFormField({ value: values[k] })),
  );
  return res;
};
