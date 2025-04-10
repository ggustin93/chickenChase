import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Bar } from '../data/types'; // Ajustez le chemin si nécessaire

// Importer les images pour les icônes Leaflet
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

// Supprimer la configuration globale L.Icon.Default
// L.Icon.Default.mergeOptions({...

// Créer explicitement l'icône par défaut
const defaultIcon = new L.Icon({
  iconRetinaUrl: iconRetinaUrl,
  iconUrl: iconUrl,
  shadowUrl: shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});

interface GameMapProps {
  bars: Bar[];
  currentBar?: Bar;
  center: [number, number]; // [latitude, longitude]
  zoom: number;
}

const GameMap: React.FC<GameMapProps> = ({ bars, currentBar, center, zoom }) => {
  // Icône personnalisée pour le bar actuel (Poulet)
  // Simplifiée pour le test - utilise la même image que l'icône par défaut mais plus grande
  const currentBarIcon = new L.Icon({
    iconUrl: iconUrl, // Utiliser l'icône importée
    iconRetinaUrl: iconRetinaUrl, // Utiliser l'icône importée
    iconSize: [35, 57], // Taille un peu plus grande
    iconAnchor: [17, 57], // Ajuster l'ancre
    popupAnchor: [1, -48],
    shadowUrl: shadowUrl, // Utiliser l'import pour l'ombre
    shadowSize: [41, 41]
  });

  return (
    <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {bars.map(bar => (
        <Marker 
          key={bar.id} 
          position={[bar.latitude, bar.longitude]} 
          // Utiliser explicitement l'icône par défaut ou l'icône personnalisée
          icon={currentBar?.id === bar.id ? currentBarIcon : defaultIcon} 
        >
          <Popup>
            <b>{bar.name}</b><br />
            {bar.address}<br />
            {currentBar?.id === bar.id && <i>(Votre position actuelle)</i>}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default GameMap; 