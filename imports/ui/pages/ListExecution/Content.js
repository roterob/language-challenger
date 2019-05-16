import React, { useState } from 'react';
import classNames from 'classnames';

import Row from 'antd/lib/row';
import Col from 'antd/lib/col';
import Icon from 'antd/lib/icon';
import Button from 'antd/lib/button';

import styles from './index.less';

export default ({ config, result, onResult }) => {
  const [revealAnswer, setRevealAnswer] = useState(result.result != null);
  const { questionLang, playQuestion, playAnswer } = config;
  const { resource } = result;

  const answerLang = questionLang === 'es' ? 'en' : 'es';

  const handleRevealAnswer = () => {
    setRevealAnswer(true);
  };

  return (
    <div className={styles.content}>
      <Row>
        <Col span={20} className="left-content">
          {resource.info[questionLang].text}
        </Col>
        <Col span={4} className="right-content">
          <Icon type="sound" />
        </Col>
      </Row>
      <Row>
        <Col span={20} className="left-content">
          {revealAnswer && (
            <React.Fragment>{resource.info[answerLang].text}</React.Fragment>
          )}
        </Col>
        <Col span={4} className="right-content">
          {revealAnswer ? (
            <Icon type="sound" />
          ) : (
            <Icon type="question" onClick={handleRevealAnswer} />
          )}
        </Col>
      </Row>
      <Row className="footer">
        <Col span={24}>
          <Button
            className={classNames('fail', {
              desactive: result.result === true,
            })}
            onClick={() => onResult(false)}
          >
            Incorrect
          </Button>
          <Button
            className={classNames('success', {
              desactive: result.result === false,
            })}
            onClick={() => onResult(true)}
          >
            Correct
          </Button>
        </Col>
      </Row>
    </div>
  );
};
