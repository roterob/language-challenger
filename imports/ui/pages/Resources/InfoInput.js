import React from 'react';

import Input from 'antd/lib/input';
import Row from 'antd/lib/row';
import Col from 'antd/lib/col';

import AudioPlayer from '../../components/audio-player';
import getAudioLink from '../../../modules/get-audio-link';

// Must be a class. antd form restriction
export default class InfoInput extends React.Component {
  state = {
    playResource: null,
  };

  setPlayResource = lang => {
    this.setState({ playResource: lang });
  };

  handleInputChange = (lang, input, value) => {
    const { onChange, value: info } = this.props;

    const newValue = { ...info };
    newValue[lang][input] = value;
    onChange(newValue);
  };

  getPlayButton = lang => {
    const { playResource } = this.state;
    const { value: info } = this.props;

    return (
      <AudioPlayer
        audioLink={getAudioLink(info[lang].audio)}
        play={playResource === lang}
        onPlay={() => this.setPlayResource(lang)}
        defaultIcon="audio"
        onEnd={() => {}}
      />
    );
  };

  render() {
    const { value: info } = this.props;

    return (
      <React.Fragment>
        {Object.keys(info).map(lang => (
          <Row key={lang}>
            <Col span={24}>
              <span>{lang.toUpperCase()}:</span>
              <Input
                placeholder="text"
                value={info[lang].text}
                onChange={e =>
                  this.handleInputChange(lang, 'text', e.target.value)
                }
              />
              <Input
                placehodler="audio"
                value={info[lang].audio}
                onChange={e =>
                  this.handleInputChange(lang, 'audio', e.target.value)
                }
                addonAfter={this.getPlayButton(lang)}
              />
            </Col>
          </Row>
        ))}
      </React.Fragment>
    );
  }
}
