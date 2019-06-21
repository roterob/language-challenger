import React, { useState, useMemo, useRef } from 'react';
import classNames from 'classnames';

import Row from 'antd/lib/row';
import Col from 'antd/lib/col';
import Avatar from 'antd/lib/avatar';
import Card from 'antd/lib/card';
import Steps from 'antd/lib/steps';
import Button from 'antd/lib/button';
import Upload from 'antd/lib/upload';
import Icon from 'antd/lib/icon';
import Alert from 'antd/lib/alert';

import TaskProgress from './TaskProgress';
import Loading from '../../components/PageLoading';
import PageHeaderWrapper from '../../components/PageHeaderWrapper';

import styles from '../index.less';
import useTimeout from '../../components/use-timeout';

function Imports({ isLoading, isMobile, task = {}, onFileSelected }) {
  const MIN_TIME_TRANSITION = 1500;

  const uploadHandler = useRef();

  const [importStatus, setImportStatus] = useState({
    currentStep: 0,
    fileName: '',
    error: '',
    delayedStatus: {},
    delay: 0,
    task: null,
  });

  const setImportStatusTransition = (
    newStatus,
    delay = MIN_TIME_TRANSITION,
  ) => {
    setImportStatus(current => ({
      ...current,
      delayedStatus: newStatus,
      delay,
    }));
  };

  useTimeout(() => {
    setImportStatus(current => ({
      ...current,
      ...current.delayedStatus,
      delayedStatus: {},
      delay: 0,
    }));
  }, importStatus.delay);

  useMemo(() => {
    if (task._id) {
      setImportStatusTransition({
        currentStep: 2,
        fileName: task.fileName,
        task,
      });
    }
  }, [task._id]);

  const headerContent = (
    <div className={styles.pageHeaderContent}>
      {!isMobile && (
        <div className={styles.avatar}>
          <Avatar size={64} icon="upload" />
        </div>
      )}
      <div className={styles.content}>
        <div className={styles.contentTitle}>Resource importing</div>
        <div>
          Batch resource importing. Learn more <a href="#">here</a>
        </div>
      </div>
    </div>
  );

  const getFileUpload = () => {
    const { currentStep, fileName, error } = importStatus;
    return (
      <React.Fragment>
        <span>{fileName}</span>&nbsp;
        {(currentStep == 0 || error) && (
          <Upload
            beforeUpload={handleFileUpload}
            previewFile={false}
            showUploadList={false}
          >
            <Button icon="upload" size="small">
              Upload
            </Button>
          </Upload>
        )}
      </React.Fragment>
    );
  };

  const getUploadingStatus = () => {
    const { currentStep, error } = importStatus;

    let res = null;

    if (currentStep == 1) {
      if (error) {
        res = (
          <Alert
            message="Uploading error"
            description={error}
            type="error"
            closable={false}
          />
        );
      } else {
        res = (
          <Button
            type="danger"
            size="small"
            onClick={() => uploadHandler.current.abort()}
          >
            Cancel
          </Button>
        );
      }
    }

    return res;
  };

  const getImportingStatus = () => {
    const { currentStep, task, error, importMessage } = importStatus;
    let res = null;
    if (currentStep == 2) {
      res = (
        <React.Fragment>
          <TaskProgress taskId={task._id} onFinish={handleImportFinished} />
          {error && (
            <Alert type="error" message="Importing error" description={error} />
          )}
        </React.Fragment>
      );
    } else if (importMessage) {
      res = <span>{importMessage}</span>;
    }

    return res;
  };

  const handleFileUploadEnd = (error, file) => {
    if (error) {
      setImportStatusTransition({ error: error.reason });
    }
  };

  const handleImportFinished = task => {
    if (task.error) {
      setImportStatusTransition({
        error: task.error,
      });
    } else {
      setImportStatusTransition({
        currentStep: 3,
        importMessage: `Imported ${task.total} resources`,
      });
    }
  };

  const handleFileUpload = file => {
    setImportStatus({ currentStep: 1, fileName: file.name });

    const handler = onFileSelected(file);
    handler.on('end', handleFileUploadEnd);
    handler.start();
    uploadHandler.current = handler;
    return false;
  };

  const { currentStep, error } = importStatus;

  return (
    <PageHeaderWrapper content={headerContent}>
      <React.Fragment>
        <Row>
          <Col span={24}>
            <Card>
              {isLoading ? (
                <Loading />
              ) : (
                <Steps
                  direction="vertical"
                  current={currentStep}
                  style={{ paddingLeft: 32 }}
                >
                  <Steps.Step
                    title="Select a file."
                    description={getFileUpload()}
                  />
                  <Steps.Step
                    title="Uploading file"
                    icon={
                      currentStep == 1 && !error ? (
                        <Icon type="loading" />
                      ) : null
                    }
                    description={getUploadingStatus()}
                  />
                  <Steps.Step
                    title="Importing resources"
                    icon={
                      currentStep == 2 && !error ? (
                        <Icon type="loading" />
                      ) : null
                    }
                    description={getImportingStatus()}
                  />
                  <Steps.Step
                    title="Process finished"
                    status={currentStep == 3 ? 'finish' : null}
                  />
                </Steps>
              )}
            </Card>
          </Col>
        </Row>
      </React.Fragment>
    </PageHeaderWrapper>
  );
}

export default Imports;
