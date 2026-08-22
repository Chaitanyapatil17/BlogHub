import React from 'react';
import './SpeedLoader.css';

export default function SpeedLoader({ 
  text = 'Loading BlogHub...', 
  fullScreen = false,
  className = ''
}) {
  const content = (
    <div className={`speed-loader-wrapper ${className}`}>
      <div className="speed-loader-box">
        {/* Loader Speeder */}
        <div className="loader">
          <span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
          </span>
          <div className="base">
            <span></span>
            <div className="face"></div>
          </div>
        </div>

        {/* Long Fazers */}
        <div className="longfazers">
          <span></span>
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>

      {text && <p className="speed-loader-text">{text}</p>}
    </div>
  );

  if (fullScreen) {
    return <div className="speed-loader-fullscreen">{content}</div>;
  }

  return <div className="speed-loader-container">{content}</div>;
}
