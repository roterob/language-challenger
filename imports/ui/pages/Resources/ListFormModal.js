import React, { useState, useMemo, useRef } from 'react';
import Modal from 'antd/lib/modal';
import Button from 'antd/lib/button';
import ListForm from './ListForm';

export default ({
  list,
  data = [],
  index = 0,
  autocompleteTags,
  onSave,
  onClose,
}) => {
  const [currentIndex, setCurrentIndex] = useState(index);
  const [isSaving, setIsSaving] = useState(false);

  let formRef = useRef();

  const handleSave = () => {
    const form = formRef.current.props.form;

    form.validateFields((err, values) => {
      if (err) {
        return;
      }

      //inject _id
      const listValues = { ...values };
      listValues._id = list ? list._id : data[currentIndex]._id;
      listValues.resources = values.resources.map(r => r._id);

      setIsSaving(true);
      onSave(listValues, error => {
        setIsSaving(false);
      });
    });
  };

  const handleNext = () => {
    setCurrentIndex(currentIndex + 1);
  };
  const handlePrevious = () => {
    setCurrentIndex(currentIndex - 1);
  };

  let listToEdit = list;
  if (list == null) {
    listToEdit = data[currentIndex];
  }

  const getButtons = () => {
    const res = [
      <Button
        key="btnSave"
        type="primary"
        loading={isSaving}
        onClick={handleSave}
      >
        Save
      </Button>,
    ];
    if (list == null) {
      res.push([
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
      ]);
    }
    return res;
  };

  const title = useMemo(() => {
    let res = `List ${currentIndex + 1} of ${data.length}`;
    if (list != null) {
      res = list.name || 'New list';
    }
    return res;
  }, [currentIndex]);

  return (
    <Modal
      visible={true}
      title={title}
      closable
      onCancel={onClose}
      onClose={onClose}
      footer={getButtons()}
    >
      {useMemo(
        () => (
          <ListForm
            wrappedComponentRef={ref => (formRef.current = ref)}
            autocompleteTags={autocompleteTags}
            {...listToEdit}
          />
        ),
        [currentIndex],
      )}
    </Modal>
  );
};
