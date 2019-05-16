import React, { useState, useRef, useMemo } from 'react';
import classNames from 'classnames';

import Modal from 'antd/lib/modal';
import Button from 'antd/lib/button';
import Icon from 'antd/lib/icon';
import Skeleton from 'antd/lib/skeleton';

import Content from './Content';
import Config from './ConfigForm';
import styles from './index.less';

import arrayToHashmap from '../../../modules/array-to-hashmap';

export default ({
  isLoading,
  fetchTimestamp,
  listExecution = {},
  resources = [],
}) => {
  const [showConfig, setShowConfig] = useState(listExecution.config == null);
  const [currentIndex, setCurrentIndex] = useState(
    listExecution.currentIndex || 0,
  );
  const formRef = useRef();

  const {
    config = {
      questionLang: 'es',
      playQuestion: false,
      playAnswer: true,
    },
    results = [],
  } = listExecution;

  useMemo(() => {
    const resourcesHashmap = arrayToHashmap('_id', resources);
    results.forEach(r => (r.resource = resourcesHashmap[r.resourceId]));
  }, [fetchTimestamp]);

  const handleShowConfig = () => {
    setShowConfig(!showConfig);
  };

  const handleClose = () => {};

  const handleSaveConfig = () => {
    const form = formRef.current.props.form;

    form.validateFields((err, values) => {
      if (err) {
        return;
      }

      setShowConfig(false);
    });
  };

  const getFooter = () => {
    let res = null;

    if (!isLoading) {
      res = [
        <Button
          key="goLeft"
          icon="arrow-left"
          disabled={currentIndex === 0}
          onClick={() => setCurrentIndex(currentIndex - 1)}
          style={{ float: 'left' }}
        />,
        <Button
          key="goRight"
          icon="arrow-right"
          disabled={results.length == 0 || currentIndex == results.length - 1}
          onClick={() => setCurrentIndex(currentIndex + 1)}
          style={{ float: 'left' }}
        />,
        <Button key="cancel">Cancelar</Button>,
      ];
      if (showConfig) {
        res = [
          <Button key="continue" type="primary" onClick={handleSaveConfig}>
            Continue
          </Button>,
        ];
      }
    }
    return res;
  };

  const getTitle = () => {
    let res = null;
    if (!isLoading) {
      res = (
        <React.Fragment>
          <Icon type="setting" onClick={handleShowConfig} />
          <span style={{ marginLeft: 10 }}>List execution</span>
          <span style={{ marginLeft: 10 }}>{`${currentIndex + 1}/${
            results.length
          }`}</span>
        </React.Fragment>
      );
      if (showConfig) {
        res = 'Execution configuration';
      }
    }
    return res;
  };

  return (
    <Modal
      visible
      footer={getFooter()}
      title={getTitle()}
      onCancel={handleClose}
      wrapClassName={classNames(styles.modal, {
        [styles.isLoading]: isLoading,
      })}
    >
      <Skeleton loading={isLoading} active>
        {showConfig ? (
          <Config
            wrappedComponentRef={ref => (formRef.current = ref)}
            {...config}
          />
        ) : (
          <Content result={results[currentIndex]} config={config} />
        )}
      </Skeleton>
    </Modal>
  );
};
