import React, { useState, useRef } from 'react';

import AutoComplete from 'antd/lib/auto-complete';
import Tag from 'antd/lib/tag';

import useEventListener from '../../components/use-event-listener';

function TagInput({ tags = [], autocompleteTags, onChange, size = 'small' }) {
  const [dataSource, setDataSource] = useState(autocompleteTags);
  const autoRef = useRef();
  const deletePrevious = useRef(false);

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

  const addTag = tag => {
    if (tag && tags.indexOf(tag) < 0) {
      deletePrevious.current = false;
      onChange([...tags, tag]);
      handleSearchTag('');
    }
  };

  const getInputValue = () => {
    return autoRef.current.querySelector('input').value;
  };

  const handleKeyDown = e => {
    if (e.key === 'Enter') {
      const tag = getInputValue();
      addTag(tag);
    } else if (
      e.key === 'Backspace' &&
      tags.length > 0 &&
      getInputValue() === ''
    ) {
      if (deletePrevious.current) {
        onChange(tags.slice(0, tags.length - 1));
        deletePrevious.current = false;
      } else {
        deletePrevious.current = true;
      }
    }
  };

  const handleSelectTag = t => {
    addTag(t);
  };

  const handleDeleteTag = tag => {
    deletePrevious.current = false;
    onChange(tags.filter(t => t !== tag));
  };

  const handleSearchTag = tag => {
    const tagUpper = tag.toUpperCase();
    let newDataSource = autocompleteTags;
    if (tag) {
      newDataSource = autocompleteTags.filter(t =>
        t.toUpperCase().includes(tagUpper),
      );
    }
    setDataSource(newDataSource);
  };

  useEventListener(
    'keydown',
    handleKeyDown,
    autoRef,
    ref => {
      return ref.current.querySelector('input');
    },
    [tags.length],
  );

  return (
    <div ref={autoRef} style={{ display: 'inline-block' }}>
      {tags.map((t, i) => (
        <span key={t} style={{ display: 'inline-block' }}>
          <Tag
            closable
            onClose={() => handleDeleteTag(t)}
            style={tagStyles[size]}
          >
            {t}
          </Tag>
        </span>
      ))}
      <AutoComplete
        key={`Autocomplete${tags.length}`} // Reset state after delete/add tag
        backfill={true}
        autoFocus={true}
        autoClearSearchValue={true}
        type="text"
        size={size}
        placeholder="tag"
        style={{ width: 78 }}
        dataSource={dataSource}
        onSelect={handleSelectTag}
        onSearch={handleSearchTag}
        dropdownMatchSelectWidth={false}
      />
    </div>
  );
}

export default TagInput;
