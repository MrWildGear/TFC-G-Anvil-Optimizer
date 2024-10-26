import React from 'react';
import './App.css';
import './theme.css';
import AnvilOptimizerDemo from './AnvilOptimizerDemo';
import { ThemeProvider, useTheme } from './ThemeContext';

const ThemedApp: React.FC = () => {
  const { theme } = useTheme();

  return (
    <div className="App" data-theme={theme}>
      <AnvilOptimizerDemo />
    </div>
  );
};

function App() {
  return (
    <ThemeProvider>
      <ThemedApp />
    </ThemeProvider>
  );
}

export default App;