// frontend/src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // Global base styles
// Import AppWrapper if Router is defined within App.js
// import AppWrapper from './App';
// Import App directly if Router is defined here or outside App.js
import App from './App';
import './firebaseConfig'; // <-- IMPORT TO INITIALIZE FIREBASE (runs the code)
import { AuthProvider } from './context/AuthContext';
// Optional: If Router is NOT inside App.js or AppWrapper, add it here
import { BrowserRouter as Router } from 'react-router-dom';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    {/* Router should generally wrap AuthProvider if not inside App */}
    <Router>
        <AuthProvider>
             {/* <AppWrapper /> */} {/* Use if Router is inside App.js */}
             <App />          {/* Use if Router is here or AppWrapper exists */}
        </AuthProvider>
    </Router>
  </React.StrictMode>
);

// Remove or fix reportWebVitals if causing issues
// import reportWebVitals from './reportWebVitals';
// reportWebVitals();