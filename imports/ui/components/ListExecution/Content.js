import React, { useState, useMemo } from 'react';
import classNames from 'classnames';

import Row from 'antd/lib/row';
import Col from 'antd/lib/col';
import Icon from 'antd/lib/icon';
import Button from 'antd/lib/button';
import Input from 'antd/lib/input';

import getAudioLink from '../../../modules/get-audio-link';
import AudioPlayer from '../audio-player';
import styles from './index.less';

export default ({ config, result, onResult }) => {
  const {
    questionLang,
    playQuestion: autoPlayQuestion,
    playAnswer: autoPlayAnswer,
    writeAnswer,
    automaticMode,
  } = config;

  const { resource, result: userResult } = result;
  const answerLang = questionLang === 'es' ? 'en' : 'es';
  const questionInfo = resource.info[questionLang];
  const answerInfo = resource.info[answerLang];

  const [revealAnswer, setRevealAnswer] = useState(false);
  const [playQuestion, setPlayQuestion] = useState(false);
  const [playAnswer, setPlayAnswer] = useState(false);
  const [pauseAutomatic, setPauseAutomatic] = useState(false);
  const [userAnswer, setUserAnswer] = useState();

  useMemo(() => {
    setRevealAnswer(userResult != null || automaticMode);

    const mustAutoPlayQuestion =
      autoPlayQuestion && (userResult == null || automaticMode);

    setPlayQuestion(mustAutoPlayQuestion);
    setPlayAnswer(
      autoPlayAnswer &&
        ((!automaticMode && userResult == null) ||
          (automaticMode && !mustAutoPlayQuestion)),
    );
    setUserAnswer('');
  }, [result.resourceId]);

  const handleRevealAnswer = () => {
    setRevealAnswer(true);
  };

  const handlePauseAutomatic = () => {
    if (pauseAutomatic) {
      if (autoPlayAnswer) {
        setPlayAnswer(true);
      } else {
        onResult(null);
      }
    }
    setPauseAutomatic(current => !current);
  };

  const handleEndAnswer = _ => {
    setPlayAnswer(false);
    if (automaticMode && !pauseAutomatic) {
      onResult(null);
    }
  };

  const handleEndQuestion = _ => {
    setPlayQuestion(false);
    if (automaticMode && !pauseAutomatic) {
      if (autoPlayAnswer) {
        setPlayAnswer(true);
      } else {
        onResult(null);
      }
    }
  };

  return (
    <div className={styles.content}>
      <Row>
        <Col span={20} className="left-content">
          {questionInfo.text}
        </Col>
        <Col span={4} className="right-content">
          <AudioPlayer
            audioLink={getAudioLink(questionInfo.audio)}
            play={playQuestion}
            onPlay={() => setPlayQuestion(true)}
            onEnd={handleEndQuestion}
          />
        </Col>
      </Row>
      <Row>
        <Col span={20} className="left-content">
          {revealAnswer && (
            <React.Fragment>
              <p>{answerInfo.text}</p>
              {userAnswer && <p className="user-answer">{userAnswer}</p>}
            </React.Fragment>
          )}
          {!revealAnswer && writeAnswer && (
            <Input.TextArea
              autoFocus
              onChange={e => setUserAnswer(e.target.value)}
              onPressEnter={e => setRevealAnswer(true)}
              style={{ height: '100%', textAlign: 'center' }}
            />
          )}
        </Col>
        <Col span={4} className="right-content">
          {revealAnswer ? (
            <AudioPlayer
              audioLink={getAudioLink(answerInfo.audio)}
              play={revealAnswer && playAnswer}
              onPlay={() => setPlayAnswer(true)}
              onEnd={handleEndAnswer}
            />
          ) : (
            <Icon type="question" onClick={handleRevealAnswer} />
          )}
        </Col>
      </Row>
      <Row className="footer">
        {automaticMode ? (
          <Col span={24}>
            <Button
              icon={pauseAutomatic ? 'play-circle' : 'pause'}
              onClick={handlePauseAutomatic}
            >
              {pauseAutomatic ? 'Continue' : 'Pause'}
            </Button>
          </Col>
        ) : (
          <React.Fragment>
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
          </React.Fragment>
        )}
      </Row>
    </div>
  );
};
