import React, { useState } from 'react';
import { IonToast } from '@ionic/react';
import { ChickenGameState } from '../../data/types';
import GameMap from '../GameMap';
import GameStatusCard from './GameStatusCard';
import './MapTabContent.css';

interface MapTabContentProps {
  gameState: ChickenGameState;
  onOpenSelectBarModal: () => void;
  onTogglePanel: (panel: string | null) => void;
}

const MapTabContent: React.FC<MapTabContentProps> = ({ 
  gameState, 
  onOpenSelectBarModal,
  onTogglePanel
}) => {
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const handleChickenRun = () => {
    if (!gameState.currentBar) return;
    
    // Cette fonction serait connectée à un backend dans une implémentation réelle
    // Pour le moment, elle affiche simplement un toast
    setToastMessage(`🐔 Chicken Run démarré à ${gameState.currentBar.name}!`);
    setShowToast(true);
  };

  return (
    <div className="map-tab-container">
      <div className="map-container">
        <GameMap 
          currentLocation={
            gameState.currentBar 
              ? [gameState.currentBar.latitude, gameState.currentBar.longitude]
              : undefined // Or provide a default location if appropriate
          }
          bars={gameState.barOptions}
        />
      </div>
      
      <div className="status-card-container">
        <GameStatusCard
          gameState={gameState}
          onOpenSelectBarModal={onOpenSelectBarModal}
          onSendClue={() => onTogglePanel('clue')}
          onChickenRun={handleChickenRun}
        />
      </div>

      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message={toastMessage}
        duration={3000}
        position="middle"
        color="success"
      />
    </div>
  );
};

export default MapTabContent; 