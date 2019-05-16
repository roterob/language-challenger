import React from 'react';
import PropTypes from 'prop-types';

import Select from 'antd/lib/select';

import TagInput from './TagInput';
import styles from './index.less';

function SearchTagBar({ type, tags, autocompleteTags, onChange, size }) {
  const handleTagsChange = tags => {
    onChange({ tags, type });
  };

  const handleTypeChange = type => {
    onChange({ tags, type });
  };

  return (
    <div className={styles.container}>
      <span style={{ display: 'inblock' }}>
        <Select
          placeholder="type"
          style={{ width: 120, marginRight: 5 }}
          allowClear
          size={size}
          onChange={handleTypeChange}
          value={type}
        >
          <Select.Option value="phrase">Phrase</Select.Option>
          <Select.Option value="vocabulary">Vocabulary</Select.Option>
          <Select.Option value="paragraph">Paragraph</Select.Option>
        </Select>
      </span>
      <TagInput
        tags={tags}
        autocompleteTags={autocompleteTags}
        size={size}
        onChange={handleTagsChange}
      />
    </div>
  );
}

SearchTagBar.propTypes = {
  type: PropTypes.string,
  tags: PropTypes.arrayOf(PropTypes.string),
  autocompleteTags: PropTypes.arrayOf(PropTypes.string),
  onChange: PropTypes.func,
  size: PropTypes.oneOf(['default', 'small']),
};

SearchTagBar.defaultProps = {
  size: 'small',
  autocompleteTags: [],
};

export default SearchTagBar;
