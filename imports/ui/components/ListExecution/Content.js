import React, { useState, useMemo } from 'react';
import classNames from 'classnames';
import ReactAudioPlayer from 'react-audio-player';

import Row from 'antd/lib/row';
import Col from 'antd/lib/col';
import Icon from 'antd/lib/icon';
import Button from 'antd/lib/button';

import styles from './index.less';

export default ({ config, result, onResult }) => {
  const {
    questionLang,
    playQuestion: autoPlayQuestion,
    playAnswer: autoPlayAnswer,
  } = config;

  const { resource, result: userResult } = result;
  const answerLang = questionLang === 'es' ? 'en' : 'es';
  const questionInfo = resource.info[questionLang];
  const answerInfo = resource.info[answerLang];

  const [revealAnswer, setRevealAnswer] = useState(false);
  const [playQuestion, setPlayQuestion] = useState(false);
  const [playAnswer, setPlayAnswer] = useState(false);

  useMemo(() => {
    setRevealAnswer(userResult != null);
    setPlayQuestion(autoPlayQuestion && userResult == null);
    setPlayAnswer(autoPlayAnswer && userResult == null);
  }, [result.resourceId]);

  const getAudioLink = resourceId =>
    `https://docs.google.com/uc?id=${resourceId}&export=download`;

  const handleRevealAnswer = () => {
    setRevealAnswer(true);
  };

  return (
    <div className={styles.content}>
      <Row>
        <Col span={20} className="left-content">
          {questionInfo.text}
        </Col>
        <Col span={4} className="right-content">
          <Icon
            type={playQuestion ? 'loading' : 'sound'}
            onClick={() => setPlayQuestion(true)}
          />
          {playQuestion && (
            <ReactAudioPlayer
              src={getAudioLink(questionInfo.audio)}
              autoPlay
              controls={false}
              onEnded={() => setPlayQuestion(false)}
            />
          )}
        </Col>
      </Row>
      <Row>
        <Col span={20} className="left-content">
          {revealAnswer && <React.Fragment>{answerInfo.text}</React.Fragment>}
        </Col>
        <Col span={4} className="right-content">
          {revealAnswer ? (
            <React.Fragment>
              <Icon
                type={playAnswer ? 'loading' : 'sound'}
                onClick={() => setPlayAnswer(true)}
              />
              {revealAnswer && playAnswer && (
                <ReactAudioPlayer
                  src={getAudioLink(answerInfo.audio)}
                  autoPlay
                  controls={false}
                  onEnded={() => setPlayAnswer(false)}
                />
              )}
            </React.Fragment>
          ) : (
            <Icon type="question" onClick={handleRevealAnswer} />
          )}
        </Col>
      </Row>
      <Row className="footer">
        <Col span={24} style={{ display: revealAnswer ? 'block' : 'none' }}>
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
        <Col span={24} style={{ display: revealAnswer ? 'none' : 'block' }}>
          <Button onClick={handleRevealAnswer}>Show answer</Button>
        </Col>
      </Row>
    </div>
  );
};
