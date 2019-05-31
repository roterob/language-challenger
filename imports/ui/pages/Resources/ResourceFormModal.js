import React, { useState, useRef, useMemo } from 'react';
import Modal from 'antd/lib/modal';
import Button from 'antd/lib/button';
import ResourceForm from './ResourceForm';

export default ({ data, index, autocompleteTags, onSave, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(index);
  const [isSaving, setIsSaving] = useState(false);

  const formRef = useRef();

  const handleSave = () => {
    const form = formRef.current.props.form;

    form.validateFields((err, values) => {
      if (err) {
        return;
      }

      //inject _id
      values['_id'] = data[currentIndex]._id;

      setIsSaving(true);
      onSave(values, error => {
        setIsSaving(false);
        if (!error && currentIndex < data.length - 1) {
          setCurrentIndex(currentIndex + 1);
        }
      });
    });
  };

  const handleNext = () => {
    setCurrentIndex(currentIndex + 1);
  };
  const handlePrevious = () => {
    setCurrentIndex(currentIndex - 1);
  };

  return (
    <Modal
      visible={true}
      title={`Resource ${currentIndex + 1} of ${data.length}`}
      closable
      onCancel={onClose}
      onClose={onClose}
      footer={[
        <Button
          key="btnLef"
          icon="arrow-left"
          disabled={currentIndex === 0}
          style={{ float: 'left' }}
          onClick={handlePrevious}
        />,
        <Button
          key="btnRight"
          icon="arrow-right"
          disabled={currentIndex + 1 === data.length}
          style={{ float: 'left' }}
          onClick={handleNext}
        />,
        <Button
          key="btnSave"
          type="primary"
          loading={isSaving}
          onClick={handleSave}
        >
          Save
        </Button>,
      ]}
    >
      {useMemo(
        () => (
          <ResourceForm
            wrappedComponentRef={ref => (formRef.current = ref)}
            autocompleteTags={autocompleteTags}
            {...data[currentIndex]}
          />
        ),
        [currentIndex],
      )}
    </Modal>
  );
};
