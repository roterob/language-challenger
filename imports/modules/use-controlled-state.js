import React, { useState } from 'react';

export default function useControlledState(value, onChange, defaultValue) {
  const [stateValue, setStateValue] = useState(value || defaultValue);

  return [stateValue, onChange || setStateValue];
}
