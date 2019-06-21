import React, { useState, useRef, useMemo } from 'react';
import classNames from 'classnames';

import Modal from 'antd/lib/modal';
import Button from 'antd/lib/button';
import Icon from 'antd/lib/icon';
import Skeleton from 'antd/lib/skeleton';
import Select from 'antd/lib/select';
import Empty from 'antd/lib/empty';

import Content from './Content';
import Result from './Result';
import Config from './ConfigForm';
import styles from './index.less';

import arrayToHashmap from '../../../modules/array-to-hashmap';

const confirm = Modal.confirm;

export default ({
  isLoading,
  fetchTimestamp,
  listExecution = {},
  resources = [],
  resourcesStats = [],
  dispatch,
  onClose,
}) => {
  const CONFIG_MODE = 'config';
  const RESULT_MODE = 'result';
  const RUN_MODE = 'run';

  const getInitViewMode = () => {
    if (listExecution.config == null) {
      return CONFIG_MODE;
    } else if (listExecution.inProgress) {
      return RUN_MODE;
    } else {
      return RESULT_MODE;
    }
  };

  const [filteredList, setFilteredList] = useState(null);
  const [showModal, setShowModal] = useState(true);
  const [viewMode, setViewMode] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(null);
  const formRef = useRef();

  const {
    config = {
      questionLang: 'es',
      playQuestion: false,
      playAnswer: true,
      automaticMode: false,
    },
    results = [],
  } = listExecution;

  const list = filteredList || results;

  useMemo(() => {
    const resourcesHashmap = arrayToHashmap('_id', resources);
    const resourcesStatsHashmap = arrayToHashmap('resourceId', resourcesStats);
    results.forEach(r => {
      r.resource = resourcesHashmap[r.resourceId] || {};
      r.resource.stats = resourcesStatsHashmap[r.resourceId] || {};
    });

    if (!isLoading && currentIndex == null) {
      setViewMode(getInitViewMode());
      setCurrentIndex(listExecution.currentIndex || 0);
    }
  }, [fetchTimestamp]);

  const stats = useMemo(() => {
    const stats = {
      correct: 0,
      incorrect: 0,
      noresults: 0,
    };
    results.forEach(r => {
      if (r.result == null) {
        stats.noresults += 1;
      } else if (r.result) {
        stats.correct += 1;
      } else {
        stats.incorrect += 1;
      }
    });
    return stats;
  }, [viewMode]);

  const goNext = () => {
    if (currentIndex == list.length - 1) {
      dispatch('executions.finish', listExecution._id);
      setCurrentIndex(0);
      setViewMode(RESULT_MODE);
    } else {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleToggleFav = () => {
    if (currentIndex != null && resources.length > 0) {
      dispatch('resources.toggleFavourite', resources[currentIndex]._id);
    }
  };

  const handleFilterChange = value => {
    let newFilteredList = null;

    if (value != 'all') {
      newFilteredList = results.filter(r => r.result == (value == 'correct'));
    }

    setCurrentIndex(0);
    setFilteredList(newFilteredList);
  };

  const handleShowConfig = () => {
    setViewMode(CONFIG_MODE);
  };

  const handleSaveResult = isCorrect => {
    if (listExecution.inProgress) {
      const currentResult = results[currentIndex];
      const result = {
        resourceId: currentResult.resourceId,
        result: isCorrect,
      };
      currentResult.result = isCorrect;
      dispatch(
        'executions.saveResult',
        listExecution._id,
        currentIndex,
        result,
      );
      goNext();
    }
  };

  const handleClose = () => {
    if (listExecution.inProgress && !listExecution.config.automaticMode) {
      confirm({
        title: 'Are you sure want to exit?',
        content: 'You can continue with the list execution later',
        onOk() {
          setShowModal(false);
          onClose();
        },
      });
    } else {
      setShowModal(false);
      onClose();
    }
  };

  const handleSaveConfig = () => {
    const form = formRef.current.props.form;

    form.validateFields((err, values) => {
      if (err) {
        return;
      }

      if (listExecution.inProgress) {
        const newConfig = { ...config, ...values };
        dispatch('executions.saveConfig', listExecution._id, newConfig);
      }
      setViewMode(RUN_MODE);
    });
  };

  const handleShowResults = () => {
    const newViewMode = viewMode === RESULT_MODE ? RUN_MODE : RESULT_MODE;
    setViewMode(newViewMode);
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
          disabled={
            list.length == 0 ||
            currentIndex == list.length - 1 ||
            viewMode !== RUN_MODE ||
            list[currentIndex].result == null
          }
          onClick={() => setCurrentIndex(currentIndex + 1)}
          style={{ float: 'left' }}
        />,
        <Button key="close" onClick={handleClose}>
          Close
        </Button>,
      ];

      if (!listExecution.inProgress) {
        res.push([
          <Button key="stats" type="primary" onClick={handleShowResults}>
            {viewMode === RUN_MODE ? 'Stats' : 'Review'}
          </Button>,
        ]);
        if (viewMode == RUN_MODE) {
          res.push([
            <Select
              key="fitler"
              style={{ float: 'left', width: 100, paddingLeft: 8 }}
              onChange={handleFilterChange}
              defaultValue="all"
            >
              <Select.Option value="all">All</Select.Option>
              <Select.Option value="correct">Correct</Select.Option>
              <Select.Option value="incorrect">Incorrect</Select.Option>
            </Select>,
          ]);
        }
      }

      if (viewMode == CONFIG_MODE) {
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
      let isFavourite = false;
      if (resources.length > 0 && currentIndex != null) {
        isFavourite = resources[currentIndex].stats.isFavourite;
      }
      res = (
        <React.Fragment>
          <Icon type="setting" onClick={handleShowConfig} />
          <span style={{ marginLeft: 10 }}>List execution</span>
          {list.length > 0 && (
            <span style={{ marginLeft: 10 }}>{`${currentIndex + 1}/${
              list.length
            }`}</span>
          )}
          {viewMode == RUN_MODE && (
            <Icon
              onClick={handleToggleFav}
              type="star"
              theme="filled"
              style={{
                fontSize: 22,
                float: 'right',
                cursor: 'pointer',
                color: isFavourite ? '#fadb14' : '#e8e8e8',
              }}
            />
          )}
        </React.Fragment>
      );
      if (viewMode == CONFIG_MODE) {
        res = 'Execution configuration';
      }
    }
    return res;
  };

  const currentResource = list[currentIndex];

  return (
    <Modal
      visible={showModal}
      closable={isLoading}
      footer={getFooter()}
      title={getTitle()}
      onCancel={handleClose}
      wrapClassName={classNames(styles.modal, {
        [styles.isLoading]: isLoading,
      })}
    >
      <Skeleton loading={isLoading} active>
        {viewMode == CONFIG_MODE ? (
          <Config
            wrappedComponentRef={ref => (formRef.current = ref)}
            {...config}
          />
        ) : viewMode == RESULT_MODE ? (
          <Result {...stats} />
        ) : currentResource ? (
          <Content
            key={currentResource._id}
            result={currentResource}
            config={config}
            onResult={handleSaveResult}
          />
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </Skeleton>
    </Modal>
  );
};
