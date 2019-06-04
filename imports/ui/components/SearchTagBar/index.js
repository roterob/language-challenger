import React, { useState, useRef, useMemo } from 'react';

import AutoComplete from 'antd/lib/auto-complete';

import useEventListener from '../use-event-listener';
import Tag from './Tag';

export default function({
  tags = [],
  autocompleteTags = [],
  onChange,
  size = 'small',
  fields = [],
}) {
  const [dataSource, setDataSource] = useState([]);
  const autoRef = useRef();
  const deletePrevious = useRef(false);

  let autoCompleteDataSource = useMemo(() => {
    const allTags = [
      ...fields
        .filter(f => !tags.some(t => t.startsWith(f.name)))
        .map(f =>
          f.options && f.options.length > 0
            ? f.options.map(o => `${f.name}:${o}`)
            : `${f.name}:`,
        )
        .flat(),
      ...autocompleteTags,
    ];
    setDataSource(allTags);
    return allTags;
  }, [autocompleteTags, fields]);

  const addTag = tag => {
    if (tag && !tag.endsWith(':') && tags.indexOf(tag) < 0) {
      deletePrevious.current = false;
      onChange([...tags, tag]);
      handleSearchTag('');
    } else if (tag.endsWith(':')) {
      const field = tag.substring(0, tag.indexOf(':'));
      updateAutoCompleteDataSource(field);
    }
  };

  const getInputValue = () => {
    return autoRef.current.querySelector('input').value;
  };

  const updateAutoCompleteDataSource = field => {
    let ds = autoCompleteDataSource;
    if (field) {
      ds = (fields.find(f => f.name === field).options || []).map(
        v => `${field}:${v}`,
      );
    }
    setDataSource(ds);
  };

  const handleKeyUp = e => {
    if (e.key === 'Enter' || e.key === ':') {
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

  const handleChangeTag = (tag, value, index) => {
    onChange(
      tags.map((v, i) => {
        if (index == i) {
          return `${tag.trim()}:${value.trim()}`;
        } else {
          return v;
        }
      }),
    );
  };

  const handleSearchTag = tag => {
    const tagUpper = tag.toUpperCase();
    let newDataSource = autoCompleteDataSource;
    if (tag) {
      newDataSource = autoCompleteDataSource.filter(t =>
        t.toUpperCase().includes(tagUpper),
      );
    }
    setDataSource(newDataSource);
  };

  useEventListener(
    'keyup',
    handleKeyUp,
    autoRef,
    ref => {
      return ref.current.querySelector('input');
    },
    [tags.length],
  );

  return (
    <div ref={autoRef} style={{ display: 'inline-block' }}>
      {tags.map((t, i) => (
        <Tag
          key={t}
          tag={t}
          index={i}
          fields={fields}
          size={size}
          onDelete={handleDeleteTag}
          onChange={handleChangeTag}
        />
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
