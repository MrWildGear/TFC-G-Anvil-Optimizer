// Import the core React library and ReactDOM for rendering
import React from 'react';
import ReactDOM from 'react-dom';

// Import the main CSS file for global styles
import './index.css';

// Import the main application component
import App from './App';

// Render the App component into the root DOM node with React's StrictMode enabled
ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  // Specifies the HTML element where the React application will be mounted
  document.getElementById('root')
);
