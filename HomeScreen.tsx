import React from 'react';
import './App.css';

interface HomeScreenProps {
  onSelectMode: (mode: 'experiment' | 'missions') => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ onSelectMode }) => {
  return (
    <div className="home-screen">
      <header className="home-header">
        <h1>Electric ChemLab</h1>
      </header>
      <div className="mode-selection">
        <button className="mode-button" onClick={() => onSelectMode('experiment')}>
          Open Experimentation
        </button>
        <button className="mode-button" onClick={() => onSelectMode('missions')}>
          Missions
        </button>
      </div>
    </div>
  );
};

export default HomeScreen;
