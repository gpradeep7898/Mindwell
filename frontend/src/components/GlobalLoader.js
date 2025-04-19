// frontend/src/components/GlobalLoader.js
import React from 'react';
import './GlobalLoader.css'; // Link to its CSS file

const GlobalLoader = ({ message = "Loading..." }) => {
  return (
    // Overlay to cover the screen or relevant container
    <div className="global-loader-overlay" role="status" aria-live="polite" aria-label={message}>
      {/* Spinner Element */}
      <div className="loading-spinner aura-spinner">
         {/* You can put SVG or CSS spinner elements inside here if needed */}
      </div>
      {/* Loading Message */}
      <p className="loader-message">{message}</p>
    </div>
  );
};

export default GlobalLoader;