import React, { useState } from 'react';

import Dropdown from 'antd/lib/dropdown';
import Menu from 'antd/lib/menu';
import DataPicker from 'antd/lib/date-picker';
import Tag from 'antd/lib/tag';
import Input from 'antd/lib/input';

import {
  stringToMoment,
  dateToString,
  stringIsDate,
} from '../../../modules/date-helpers';
import styles from './index.less';

export default ({ tag, index, fields, size, onDelete, onChange }) => {
  const [tagName, tagValue] = tag.split(':');
  const field = fields.find(f => f.name == tagName);
  const [popupOpen, setPopupOpen] = useState(false);
  const [value, setValue] = useState(tagValue);

  const tagStyles = {
    small: {
      marginTop: 0,
    },
    default: {
      marginTop: 3,
      padding: 5,
      fontSize: 14,
    },
  };

  const handleChange = (t, v) => {
    setPopupOpen(false);
    onChange(t, v, index);
  };

  const stopPropagation = e => {
    e.stopPropagation();
  };

  const buildDropDownTag = () => {
    const menu = (
      <Menu onClick={v => handleChange(tagName, v.key, index)}>
        {field &&
          field.options &&
          field.options.map(o => <Menu.Item key={o}>{o}</Menu.Item>)}
      </Menu>
    );

    return (
      <Dropdown overlay={menu}>
        <span className={styles.value}>{tagValue}</span>
      </Dropdown>
    );
  };

  const buildDataPickerTag = () => {
    const menu = (
      <div>
        <DataPicker
          open={popupOpen}
          value={stringToMoment(value)}
          onChange={v => onChange(tagName, dateToString(v), index)}
          dropdownClassName={styles['date-picker']}
          getCalendarContainer={triggerNode => triggerNode.parentNode}
          renderExtraFooter={() => (
            <Input
              style={{ width: '100%' }}
              placeholder="dynamic expression here"
              onClick={stopPropagation}
              value={stringIsDate(value) ? null : value}
              onPressEnter={e => handleChange(tagName, e.target.value, index)}
              onChange={e => setValue(e.target.value)}
            />
          )}
        />
      </div>
    );

    return (
      <Dropdown overlay={menu} onVisibleChange={setPopupOpen}>
        <span className={styles.value}>{tagValue}</span>
      </Dropdown>
    );
  };

  const tagBuilders = {
    select: buildDropDownTag,
    date: buildDataPickerTag,
  };

  return (
    <span style={{ display: 'inline-block', cursor: 'pointer' }}>
      <Tag
        closable
        onClose={() => onDelete(tag, index)}
        style={tagStyles[size]}
      >
        {tagValue ? `${tagName}: ` : tagName}
        {tagValue && tagBuilders[field.type]()}
      </Tag>
    </span>
  );
};
