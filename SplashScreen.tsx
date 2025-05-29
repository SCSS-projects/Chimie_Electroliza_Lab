import React from 'react';
import './App.css';

interface SplashScreenProps {
  onGetStarted: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onGetStarted }) => {
  return (
    <div className="splash-screen">
      <div className="splash-content">
        <h1>Laborator electroliza</h1>
        <p>Simulare experimente de electroliză</p>
        <button onClick={onGetStarted}>Să incepem</button>
      </div>
    </div>
  );
};

export default SplashScreen;
