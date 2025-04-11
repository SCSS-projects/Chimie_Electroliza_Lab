import React from 'react';
import './App.css';

interface SplashScreenProps {
  onGetStarted: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onGetStarted }) => {
  return (
    <div className="splash-screen">
      <div className="splash-content">
        <h1>Electric ChemLab</h1>
        <p>Simulate Electrolysis Experiments</p>
        <button onClick={onGetStarted}>Get Started</button>
      </div>
    </div>
  );
};

export default SplashScreen;
