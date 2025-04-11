import React from 'react';
import './App.css';

interface MissionsScreenProps {
  onBack: () => void;
}

const MissionsScreen: React.FC<MissionsScreenProps> = ({ onBack }) => {
  return (
    <div className="missions-screen">
      <div className="header-bar">
        <button onClick={onBack} className="back-button">Back</button>
        <h2>Missions</h2>
      </div>
      <div className="mission-cards">
        <div className="mission-card">
          <h3>Copper Refining</h3>
          <p>Goal: Deposit Copper Metal</p>
          <p>Progress: 60%</p>
          <button>Start Mission ▶</button>
        </div>
        <div className="mission-card">
          <h3>Hydrogen Production</h3>
          <p>Goal: Collect Hydrogen Gas</p>
          <p>Progress: 40%</p>
          <button>Start Mission ▶</button>
        </div>
      </div>
    </div>
  );
};

export default MissionsScreen;
