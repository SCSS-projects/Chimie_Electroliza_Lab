import React from 'react';
import './App.css';

interface HomeScreenProps {
  onSelectMode: (mode: 'experiment') => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ onSelectMode }) => {
  return (
    <div className="home-screen">
      <header className="home-header">
        <h1> Electroliza </h1>
      </header>
      <div className="mode-selection">
        <button className="mode-button" onClick={() => onSelectMode('experiment')}>
          Deschide Experimentarea
        </button>
      </div>
    </div>
  );
};

export default HomeScreen;
