import React, { useState, useRef, useMemo } from 'react';
import Modal from 'antd/lib/modal';
import Button from 'antd/lib/button';
import ResourceForm from './ResourceForm';
import createResourceCode from '../../../modules/create-resource-code';

export default ({ data, index, autocompleteTags, onSave, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(index);
  const [isSaving, setIsSaving] = useState(false);
  const isNewResource = index < 0;
  const resource = data[index] || {
    resourceCode: createResourceCode(),
    type: "phrase",
    tags: ["manual"],
    info: { es: {text: "", audio: "-"}, en: {text: "", audio: "-"} },
  };

  const formRef = useRef();

  const handleSave = () => {
    const form = formRef.current.props.form;

    form.validateFields((err, values) => {
      if (err) {
        return;
      }

      //inject _id
      values['_id'] = resource._id;

      setIsSaving(true);
      onSave(values, error => {
        setIsSaving(false);
        if (!error && currentIndex < data.length - 1) {
          const newIndex = isNewResource ? currentIndex - 1 : currentIndex + 1;
          setCurrentIndex(newIndex);
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
      title={
        isNewResource
          ? "New Resource"
          : `Resource ${currentIndex + 1} of ${data.length}`
      }
      closable
      onCancel={onClose}
      onClose={onClose}
      footer={[
        <Button
          key="btnLef"
          icon="arrow-left"
          disabled={currentIndex === 0 || isNewResource}
          style={{ float: "left" }}
          onClick={handlePrevious}
        />,
        <Button
          key="btnRight"
          icon="arrow-right"
          disabled={currentIndex + 1 === data.length || isNewResource}
          style={{ float: "left" }}
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
            wrappedComponentRef={(ref) => (formRef.current = ref)}
            autocompleteTags={autocompleteTags}
            {...resource}
          />
        ),
        [currentIndex]
      )}
    </Modal>
  );
};
