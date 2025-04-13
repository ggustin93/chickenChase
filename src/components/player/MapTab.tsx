import React, { useState, useEffect } from 'react';
import { 
  IonIcon, IonFabButton, IonList, IonItem, IonThumbnail, IonLabel, IonNote,
  IonSegment, IonSegmentButton, IonButton, IonAlert
} from '@ionic/react';
import { 
  locateOutline, refreshOutline, checkmarkCircle, ellipseOutline,
  navigateOutline, mapOutline, listOutline
} from 'ionicons/icons';
import GameMap from '../GameMap';
import { Bar } from '../../data/types';
import { GeolocationPosition } from '@capacitor/geolocation';
import PlayerGameStatusCard from './PlayerGameStatusCard';
import { calculateDistance, formatDistance } from '../../utils/distanceUtils';
import './MapTab.css';

interface MapTabProps {
  bars: Bar[];
  visitedBars: Bar[];
  currentPosition: GeolocationPosition | null;
  isGettingLocation: boolean;
  isWatchingLocation: string | undefined;
  handleGetCurrentLocation: () => void;
  handleToggleWatchLocation: () => void;
  handleBarVisitAttempt: (barId: string) => void;
  score: number;
  gameTime: string;
  challengesCompleted: number;
  totalChallenges: number;
  cagnotteCurrentAmount?: number;
  cagnotteInitialAmount?: number;
  isCagnotteLoading?: boolean;
  error?: GeolocationPositionError | Error | null;
}

const MapTab: React.FC<MapTabProps> = ({ 
  bars, 
  visitedBars, 
  currentPosition, 
  isGettingLocation, 
  isWatchingLocation,
  handleGetCurrentLocation,
  handleToggleWatchLocation,
  handleBarVisitAttempt,
  score,
  gameTime,
  challengesCompleted,
  totalChallenges,
  cagnotteCurrentAmount,
  cagnotteInitialAmount,
  isCagnotteLoading,
  error
}) => {
  const [activeSegment, setActiveSegment] = useState<'map' | 'list'>('map');
  const [showLocationHelp, setShowLocationHelp] = useState<boolean>(false);

  // Show help alert when permission errors occur
  useEffect(() => {
    if (error && error.message.includes('Permissions refusées')) {
      setShowLocationHelp(true);
    }
  }, [error]);

  // Calculer les distances pour chaque bar si la position est disponible
  const barsWithDistance = bars.map(bar => {
    let distance = null;
    if (currentPosition) {
      distance = calculateDistance(
        currentPosition.coords.latitude,
        currentPosition.coords.longitude,
        bar.latitude,
        bar.longitude
      );
    }
    return {
      ...bar,
      distance
    };
  });

  // Trier les bars par distance (si disponible) ou par ordre alphabétique
  const sortedBars = [...barsWithDistance].sort((a, b) => {
    if (a.distance !== null && b.distance !== null) {
      return a.distance - b.distance;
    } else if (a.distance !== null) {
      return -1;
    } else if (b.distance !== null) {
      return 1;
    } else {
      return a.name.localeCompare(b.name);
    }
  });

  const visitedBarIds = visitedBars.map(bar => bar.id);

  return (
    <div className="map-tab-container">
      
      {/* Wrapper for flex-grow content (Segment + Map/List) */}
      <div className="map-list-view-wrapper">
        {/* Segment for Map/List Toggle */}
        <IonSegment 
          value={activeSegment} 
          onIonChange={e => setActiveSegment(e.detail.value as 'map' | 'list')}
          className="map-list-segment"
        >
          <IonSegmentButton value="map">
            <IonLabel>Carte</IonLabel>
            <IonIcon icon={mapOutline} />
          </IonSegmentButton>
          <IonSegmentButton value="list">
            <IonLabel>Liste</IonLabel>
            <IonIcon icon={listOutline} />
          </IonSegmentButton>
        </IonSegment>

        {/* Conditional Rendering: Map or List */}
        {activeSegment === 'map' && (
          <div className="map-section">
            {/* Map Container */}
            <div className="map-wrapper">
              <GameMap
                bars={bars}
                visitedBars={visitedBarIds}
                currentLocation={currentPosition ? [currentPosition.coords.latitude, currentPosition.coords.longitude] : undefined}
              />
              
              {/* Position indicator - Bottom left with icon */}
              <div className="position-indicator">
                <div className="position-display">
                  <IonIcon icon={locateOutline} className="position-icon" />
                  <span className="position-text">
                    {currentPosition ? (
                      `${currentPosition.coords.latitude.toFixed(4)}, ${currentPosition.coords.longitude.toFixed(4)}`
                    ) : isGettingLocation ? (
                      'Recherche de la position...'
                    ) : isWatchingLocation ? (
                      'Suivi de position actif...'
                    ) : (
                      'Position inconnue. Appuyez sur "Actualiser"'
                    )}
                  </span>
                </div>
              </div>
              
              {/* Geolocation FAB buttons - Bottom RIGHT of map */}
              <div className="map-controls">
                {/* Actualiser Button */}
                <div className="button-container">
                  <IonFabButton 
                    size="small"
                    disabled={isGettingLocation}
                    onClick={handleGetCurrentLocation}
                    className="map-control-button"
                  >
                    {isGettingLocation ? (
                      <div className="loading-spinner"></div>
                    ) : (
                      <IonIcon icon={refreshOutline} className="control-icon" />
                    )}
                  </IonFabButton>
                  <div className="button-label">
                    {isGettingLocation ? 'RECHERCHE...' : 'ACTUALISER'}
                  </div>
                </div>
                
                {/* Suivre Button */}
                <div className="button-container">
                  <IonFabButton 
                    size="small"
                    onClick={handleToggleWatchLocation}
                    className={`map-control-button ${isWatchingLocation ? 'watching' : ''}`}
                  >
                    <IonIcon icon={locateOutline} className="control-icon" />
                  </IonFabButton>
                  <div className="button-label">
                    {isWatchingLocation ? 'ARRÊTER' : 'SUIVRE'}
                  </div>
                </div>
              </div>
            </div>

            {/* Add this to the map section */}
            {!currentPosition && error && error.message.includes('Permissions refusées') && (
              <div className="location-error-banner">
                <IonIcon icon={locateOutline} />
                <p>Position non disponible. Vous devez autoriser la géolocalisation.</p>
                <IonButton 
                  size="small" 
                  fill="outline" 
                  onClick={() => setShowLocationHelp(true)}
                >
                  Comment faire ?
                </IonButton>
              </div>
            )}
          </div>
        )}

        {activeSegment === 'list' && (
          <div className="list-section">
            {/* Bars List Title (simplified in design) */}
            <div className="bars-list-header">
              <div className="bars-list-title">
                <IonIcon icon={mapOutline} />
                <span>Lieux à visiter ({visitedBars.length}/{bars.length})</span>
              </div>
            </div>

            {/* Bars List */}
            <div className="bar-list-container">
              <IonList lines="full" className="bar-list-player">
                {sortedBars.map(bar => {
                  const isVisited = visitedBarIds.includes(bar.id);
                  return (
                    <IonItem 
                      key={bar.id} 
                      button={!isVisited} 
                      onClick={() => !isVisited && handleBarVisitAttempt(bar.id)} 
                      detail={!isVisited} 
                      color={isVisited ? 'light' : undefined}
                      className={isVisited ? 'visited-bar-item' : 'unvisited-bar-item'}
                    >
                      <IonThumbnail slot="start" className="bar-thumbnail-player">
                        <img 
                          alt={bar.name} 
                          src={bar.photoUrl || 'https://ionicframework.com/docs/img/demos/thumbnail.svg'} 
                          onError={(e) => (e.currentTarget.src = 'https://ionicframework.com/docs/img/demos/thumbnail.svg')} 
                        />
                      </IonThumbnail>
                      <IonIcon
                        icon={isVisited ? checkmarkCircle : ellipseOutline}
                        color={isVisited ? 'success' : 'medium'}
                        slot="start"
                        className="visit-status-icon"
                      />
                      <IonLabel className={isVisited ? 'ion-text-wrap text-medium' : 'ion-text-wrap'}>
                        <h2>{bar.name}</h2>
                        {isVisited ? (
                          <IonNote color="success">Déjà visité</IonNote>
                        ) : (
                          <div>
                            <IonNote color="medium">{bar.address}</IonNote>
                            {bar.distance !== null && (
                              <div className="distance-indicator">
                                <IonIcon icon={navigateOutline} size="small" color="primary" />
                                <span className="distance-value">{formatDistance(bar.distance)}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </IonLabel>
                    </IonItem>
                  );
                })}
              </IonList>
            </div>
          </div>
        )}
      </div> {/* End of map-list-view-wrapper */}

      {/* Game Status Card (Stays at the bottom) */}
      <div className="game-status-container">
        <PlayerGameStatusCard
          score={score}
          gameTime={gameTime}
          barsVisited={visitedBars.length}
          totalBars={bars.length}
          challengesCompleted={challengesCompleted}
          totalChallenges={totalChallenges}
          cagnotteCurrentAmount={cagnotteCurrentAmount}
          cagnotteInitialAmount={cagnotteInitialAmount}
          isCagnotteLoading={isCagnotteLoading}
        />
      </div>

      {/* Add a help alert */}
      <IonAlert
        isOpen={showLocationHelp}
        onDidDismiss={() => setShowLocationHelp(false)}
        header="Activer la géolocalisation"
        message={`
          Pour participer au jeu, vous devez autoriser la géolocalisation:
          
          ${error && error.message.includes('Permissions refusées') 
            ? error.message.split('Permissions refusées.')[1].trim() 
            : `
              - Sur iPhone: Réglages > Safari > Position
              - Sur Android: Paramètres > Site web > Localisation
              - Sur ordinateur: Cliquez sur l'icône de cadenas dans la barre d'adresse
            `}
          
          Après avoir modifié les paramètres, revenez à l'application et appuyez sur "Actualiser".
        `}
        buttons={[
          {
            text: 'J\'ai compris',
            role: 'cancel'
          }
        ]}
      />

    </div>
  );
};

export default MapTab; 