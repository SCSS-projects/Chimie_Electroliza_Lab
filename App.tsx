import React, { useState, useEffect } from 'react';
import SplashScreen from './SplashScreen';
import HomeScreen from './HomeScreen';
import ExperimentationScreen from './ExperimentationScreen';
import MissionsScreen from './MissionsScreen';
import TheoreticalGuide from './TheoreticalGuide';
import './App.css';

const App: React.FC = () => {
  // Screen states: "splash", "home", "experiment", "missions"
  const [screen, setScreen] = useState<'splash' | 'home' | 'experiment' | 'missions'>('splash');
  const [showGuide, setShowGuide] = useState(false);

  // Automatically transition from splash to home after 3 seconds.
  useEffect(() => {
    if (screen === 'splash') {
      const timer = setTimeout(() => {
        setScreen('home');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [screen]);

  const renderScreen = () => {
    switch (screen) {
      case 'splash':
        return <SplashScreen onGetStarted={() => setScreen('home')} />;
      case 'home':
        return <HomeScreen onSelectMode={(mode) => setScreen(mode)} />;
      case 'experiment':
        return (
          <ExperimentationScreen
            onBack={() => setScreen('home')}
            onShowGuide={() => setShowGuide(true)}
          />
        );
      case 'missions':
        return <MissionsScreen onBack={() => setScreen('home')} />;
      default:
        return null;
    }
  };

  return (
    <div className="app-container">
      {renderScreen()}
      {showGuide && <TheoreticalGuide onClose={() => setShowGuide(false)} />}
    </div>
  );
};

export default App;
