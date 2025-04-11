import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { IonButton, IonIcon, IonBadge } from '@ionic/react';
import { navigateOutline, locationOutline, checkmarkDoneCircleOutline } from 'ionicons/icons';
import { Bar } from '../data/types';
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

interface GameMapProps {
  bars: Bar[];
  visitedBars?: string[]; // IDs of visited bars, now optional
  currentLocation?: [number, number];
  onNavigateToBar?: (bar: Bar) => void;
}

const RecenterAutomatically: React.FC<{
  position?: [number, number];
}> = ({ position }) => {
  const map = useMap();
  
  React.useEffect(() => {
    if (position) {
      map.setView(position, map.getZoom());
    }
  }, [position, map]);
  
  return null;
};

const GameMap: React.FC<GameMapProps> = ({ 
  bars, 
  visitedBars = [], // Default to empty array
  currentLocation, 
  onNavigateToBar 
}) => {
  // Default position (center of Brussels)
  const defaultPosition: [number, number] = [50.8503, 4.3517]; // Updated coordinates
  
  const getBarIcon = (bar: Bar) => {
    return visitedBars.includes(bar.id) ? visitedBarIcon : barIcon;
  };
  
  return (
    <MapContainer 
      center={currentLocation || defaultPosition} 
      zoom={15} 
      className="game-map"
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
            </div>
          </Popup>
        </Marker>
      ))}
      
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
    </MapContainer>
  );
};

export default GameMap; 