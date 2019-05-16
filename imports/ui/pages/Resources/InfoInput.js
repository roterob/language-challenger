import React from 'react';

import Input from 'antd/lib/input';
import Row from 'antd/lib/row';
import Col from 'antd/lib/col';
import Icon from 'antd/lib/icon';

// Must be a class. antd form restriction
export default class InfoInput extends React.Component {
  handleInputChange = (lang, input, value) => {
    const { onChange, value: info } = this.props;

    const newValue = { ...info };
    newValue[lang][input] = value;
    onChange(newValue);
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
                addonAfter={<Icon type="sound" />}
              />
            </Col>
          </Row>
        ))}
      </React.Fragment>
    );
  }
}
