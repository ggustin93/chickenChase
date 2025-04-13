import React, { useState, useEffect } from 'react';
import { 
  IonIcon, IonFabButton, IonList, IonItem, IonThumbnail, IonLabel, IonNote,
  IonSegment, IonSegmentButton, IonButton, IonAlert
} from '@ionic/react';
import { 
  locateOutline, checkmarkCircle, ellipseOutline,
  navigateOutline, mapOutline, listOutline, helpCircleOutline
} from 'ionicons/icons';
import GameMap from '../GameMap';
import { Bar } from '../../data/types';
import { Position } from '@capacitor/geolocation';
import PlayerGameStatusCard from './PlayerGameStatusCard';
import { calculateDistance, formatDistance } from '../../utils/distanceUtils';
import './MapTab.css';

interface MapTabProps {
  bars: Bar[];
  visitedBars: Bar[];
  currentPosition: Position | null;
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
  onCagnotteConsumption?: (amount: number, reason: string) => void;
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
  onCagnotteConsumption,
  error
}) => {
  const [activeSegment, setActiveSegment] = useState<'map' | 'list'>('map');
  const [showLocationHelp, setShowLocationHelp] = useState<boolean>(false);
  
  // Check for iOS device
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

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
            <IonIcon icon={mapOutline} />
          </IonSegmentButton>
          <IonSegmentButton value="list">
            <IonIcon icon={listOutline} />
          </IonSegmentButton>
        </IonSegment>

        {/* Conditional Rendering: Map or List */}
        {activeSegment === 'map' && (
          <div className="map-section">
            {/* Map Container */}
            <div className="map-wrapper">
              <GameMap
                bars={bars.map(bar => ({
                  ...bar,
                  useCustomMarker: true,
                  customMarkerHtml: visitedBarIds.includes(bar.id)
                    ? '<div class="beer-marker visited">🍺</div>'
                    : '<div class="beer-marker">🍺</div>'
                }))}
                visitedBars={visitedBarIds}
                currentLocation={currentPosition ? [currentPosition.coords.latitude, currentPosition.coords.longitude] : undefined}
                onBarClick={handleBarVisitAttempt}
                centerOnCurrentLocation={false}
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
              
              {/* Location Help Button for iOS */}
              {isIOS && (
                <div className="ios-help-button-container">
                  <IonButton 
                    size="small" 
                    fill="solid" 
                    color="warning"
                    onClick={() => setShowLocationHelp(true)}
                  >
                    <IonIcon slot="start" icon={helpCircleOutline} />
                    Activer localisation iOS
                  </IonButton>
                </div>
              )}
              
              {/* Center-on-position button (bottom right) */}
              <div className="center-position-button-container">
                <IonFabButton 
                  size="small"
                  className="center-position-button"
                  disabled={!currentPosition && !isGettingLocation}
                  onClick={() => {
                    if (!currentPosition || isWatchingLocation) {
                      // Si pas de position ou déjà en mode suivi, actualiser/arrêter
                      if (isWatchingLocation) {
                        handleToggleWatchLocation();
                      } else {
                        handleGetCurrentLocation();
                      }
                    } else {
                      // Sinon, simplement centrer la carte (fonctionnalité à implémenter)
                      console.log('Centrer la carte sur:', currentPosition.coords);
                    }
                  }}
                >
                  <IonIcon icon={!currentPosition || isGettingLocation ? locateOutline : navigateOutline} />
                  {isGettingLocation && <div className="loading-spinner-small"></div>}
                </IonFabButton>
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

      {/* Game Status Card (Stays at the bottom) - Only visible in map view */}
      {activeSegment === 'map' && (
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
            onCagnotteConsumption={onCagnotteConsumption}
          />
        </div>
      )}

      {/* Add a help alert with iOS-specific instructions */}
      <IonAlert
        isOpen={showLocationHelp}
        onDidDismiss={() => setShowLocationHelp(false)}
        header="Activer la géolocalisation"
        message={`
          Pour participer au jeu, vous devez autoriser la géolocalisation:
          
          ${isIOS ? `
            Sur iPhone/iPad (Safari):
            1. Allez dans Réglages > Safari > Position
            2. Sélectionnez "Autoriser" (pas "Demander") 
            3. Fermez complètement Safari (swiper l'app vers le haut)
            4. Rouvrez Safari et revenez au jeu
            5. Cliquez sur "Actualiser" en bas à droite
            
            Si cela ne fonctionne toujours pas:
            - Vérifiez que Safari a accès à la position dans Réglages > Confidentialité > Service de localisation > Safari
            - Essayez d'utiliser Chrome sur iOS qui peut mieux fonctionner
          ` : `
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