import { useRef, useEffect } from 'react';

const useEventListener = (
  eventName,
  handler,
  elementRef = global,
  getElement,
  depsArray = [eventName, elementRef],
) => {
  const savedHandler = useRef();

  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  useEffect(() => {
    let element = elementRef;
    if (typeof getElement === 'function') {
      element = getElement(elementRef);
    }

    if (element.current) {
      element = element.current;
    }

    const isSupported = element && element.addEventListener;
    if (!isSupported) return;

    const eventListener = event => savedHandler.current(event);
    element.addEventListener(eventName, eventListener);
    return () => {
      element.removeEventListener(eventName, eventListener);
    };
  }, depsArray);
};

export default useEventListener;
