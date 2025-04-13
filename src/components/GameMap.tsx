import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { IonButton, IonIcon, IonBadge, IonSpinner } from '@ionic/react';
import { navigateOutline, locationOutline, checkmarkDoneCircleOutline, peopleOutline, closeCircleOutline } from 'ionicons/icons';
import { Bar, Team } from '../data/types';
import './GameMap.css';
import 'leaflet/dist/leaflet.css';

// Create icons
const barIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const visitedBarIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const currentLocationIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const teamLocationIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface GameMapProps {
  bars: Bar[];
  visitedBars?: string[]; // IDs of visited bars, now optional
  currentLocation?: [number, number];
  onNavigateToBar?: (bar: Bar) => void;
  teamLocations?: Team[]; // Teams with their current locations
  onBarClick?: (barId: string) => void; // New prop for bar interaction
  isChicken?: boolean; // New prop to identify chicken role
}

// Enhanced RecenterAutomatically component
const RecenterAutomatically: React.FC<{
  position?: [number, number];
}> = ({ position }) => {
  const map = useMap();
  
  React.useEffect(() => {
    if (position) {
      map.setView(position, map.getZoom());
    }
    // Force a map redraw to ensure all tiles are loaded
    setTimeout(() => {
      map.invalidateSize();
    }, 100);
  }, [position, map]);
  
  return null;
};

// Map initialization helper
const MapInitializer: React.FC = () => {
  const map = useMap();
  
  useEffect(() => {
    // Force map to initialize properly
    setTimeout(() => {
      map.invalidateSize();
    }, 0);
    
    // Also trigger a resize when component mounts to ensure proper rendering
    window.dispatchEvent(new Event('resize'));
  }, [map]);
  
  return null;
};

const GameMap: React.FC<GameMapProps> = ({ 
  bars, 
  visitedBars = [], // Default to empty array
  currentLocation, 
  onNavigateToBar,
  teamLocations = [], // Default to empty array
  onBarClick,
  isChicken = false
}) => {
  // Default position (center of Brussels)
  const defaultPosition: [number, number] = [50.8503, 4.3517]; // Updated coordinates
  const [mapReady, setMapReady] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  
  // Trigger map reload on initial render
  useEffect(() => {
    const timer = setTimeout(() => {
      setMapReady(true);
    }, 300);
    
    return () => clearTimeout(timer);
  }, []);
  
  const getBarIcon = (bar: Bar) => {
    return visitedBars.includes(bar.id) ? visitedBarIcon : barIcon;
  };

  const handleBarMarkerClick = (bar: Bar) => {
    if (isChicken && onBarClick) {
      onBarClick(bar.id);
    }
  };
  
  return (
    <div ref={mapContainerRef} style={{ height: '100%', width: '100%' }}>
      {!mapReady && (
        <div className="map-loading-container">
          <IonSpinner name="crescent" />
          <p>Chargement de la carte...</p>
        </div>
      )}
      
      <MapContainer 
        center={currentLocation || defaultPosition} 
        zoom={15} 
        className="game-map"
        whenReady={() => setMapReady(true)}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        {bars.map((bar) => (
          <Marker 
            key={bar.id}
            position={[bar.latitude, bar.longitude]}
            icon={getBarIcon(bar)}
            eventHandlers={isChicken ? { click: () => handleBarMarkerClick(bar) } : undefined}
          >
            <Popup>
              <div className="bar-popup">
                <h3>{bar.name}</h3>
                <p>{bar.address}</p>
                {visitedBars.includes(bar.id) && (
                  <IonBadge color="success">
                    <IonIcon icon={checkmarkDoneCircleOutline} /> Visité
                  </IonBadge>
                )}
                {onNavigateToBar && (
                  <IonButton 
                    size="small"
                    onClick={() => onNavigateToBar(bar)}
                  >
                    <IonIcon icon={navigateOutline} />
                    Y aller
                  </IonButton>
                )}
                {isChicken && onBarClick && (
                  <IonButton 
                    size="small"
                    color="danger"
                    onClick={() => onBarClick(bar.id)}
                  >
                    <IonIcon icon={closeCircleOutline} />
                    Retirer (indice)
                  </IonButton>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
        
        {/* Afficher les positions des équipes */}
        {teamLocations.map((team) => {
          // Vérifier que l'équipe a une position valide
          if (team.lastLocation && team.lastLocation.latitude && team.lastLocation.longitude) {
            return (
              <Marker
                key={`team-${team.id}`}
                position={[team.lastLocation.latitude, team.lastLocation.longitude]}
                icon={teamLocationIcon}
              >
                <Popup>
                  <div className="team-popup">
                    <h3>{team.name}</h3>
                    <p>Dernière position connue</p>
                    {team.lastLocation.timestamp && (
                      <p className="timestamp">
                        {new Date(team.lastLocation.timestamp).toLocaleTimeString()}
                      </p>
                    )}
                    <IonBadge color={team.foundChicken ? "success" : "warning"}>
                      <IonIcon icon={peopleOutline} />
                      {team.foundChicken ? " A trouvé le poulet" : " En chasse"}
                    </IonBadge>
                  </div>
                </Popup>
              </Marker>
            );
          }
          return null;
        })}
        
        {currentLocation && (
          <Marker 
            position={currentLocation}
            icon={currentLocationIcon}
          >
            <Popup>
              <div className="current-location-popup">
                <IonIcon icon={locationOutline} />
                <span>Vous êtes ici</span>
              </div>
            </Popup>
          </Marker>
        )}
        
        <RecenterAutomatically position={currentLocation} />
        <MapInitializer />
      </MapContainer>
    </div>
  );
};

export default GameMap; 