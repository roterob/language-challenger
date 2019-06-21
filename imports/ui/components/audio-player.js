import React, { useState, useRef } from 'react';
import ReactAudioPlayer from 'react-audio-player';

import Icon from 'antd/lib/icon';

export default ({ audioLink, play, onPlay, defaultIcon = 'sound' }) => {
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioLoaded, setAudioLoaded] = useState(false);

  const audioRef = useRef();

  const handleEndQuestion = () => setAudioPlaying(false);

  const handleCanPlay = () => {
    setAudioPlaying(true);
    setAudioLoaded(true);
  };

  const handleIconClick = () => {
    if (!play) {
      onPlay();
    } else if (audioLoaded && !audioPlaying) {
      audioRef.current.audioEl.play();
      setAudioPlaying(true);
    } else if (audioPlaying) {
      audioRef.current.audioEl.pause();
      setAudioPlaying(false);
    }
  };

  const getIcon = () => {
    return !play
      ? defaultIcon
      : !audioLoaded
      ? 'loading'
      : audioPlaying
      ? 'pause'
      : defaultIcon;
  };

  return (
    <React.Fragment>
      <Icon type={getIcon()} onClick={handleIconClick} />
      {play && (
        <ReactAudioPlayer
          ref={el => {
            audioRef.current = el;
          }}
          src={audioLink}
          autoPlay
          controls={false}
          onCanPlay={handleCanPlay}
          onEnded={handleEndQuestion}
          onError={handleEndQuestion}
        />
      )}
    </React.Fragment>
  );
};
