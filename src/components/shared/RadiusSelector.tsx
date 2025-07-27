/**
 * Enhanced radius selector component with visual feedback
 */

import React from 'react';
import {
  IonItem,
  IonLabel,
  IonRange,
  IonNote,
  IonIcon,
  IonChip
} from '@ionic/react';
import { locationOutline, walkOutline, carOutline, bicycleOutline } from 'ionicons/icons';

interface RadiusSelectorProps {
  value: number;
  onChange: (radius: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  showPresets?: boolean;
}

const RadiusSelector: React.FC<RadiusSelectorProps> = ({
  value,
  onChange,
  min = 100,
  max = 5000,
  step = 100,
  disabled = false,
  showPresets = true
}) => {
  const formatDistance = (meters: number): string => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)} km`;
    }
    return `${meters} m`;
  };

  const getWalkingTime = (meters: number): string => {
    // Average walking speed: 5 km/h
    const minutes = Math.round((meters / 1000) * 12);
    if (minutes < 60) {
      return `~${minutes} min à pied`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `~${hours}h${remainingMinutes > 0 ? remainingMinutes.toString().padStart(2, '0') : ''} à pied`;
  };

  const getTransportIcon = (meters: number) => {
    if (meters <= 500) return walkOutline;
    if (meters <= 2000) return bicycleOutline;
    return carOutline;
  };

  const getRadiusColor = (meters: number): string => {
    if (meters <= 500) return 'success';
    if (meters <= 1500) return 'warning';
    return 'danger';
  };

  const presetValues = [
    { value: 250, label: '250m' },
    { value: 500, label: '500m' },
    { value: 1000, label: '1km' },
    { value: 2000, label: '2km' },
    { value: 3000, label: '3km' }
  ];

  const handlePresetSelect = (presetValue: number) => {
    onChange(presetValue);
  };

  return (
    <div className="radius-selector">
      <IonItem>
        <IonIcon icon={locationOutline} slot="start" />
        <div style={{ width: '100%' }}>
          <IonLabel>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span>Rayon de recherche</span>
              <IonChip color={getRadiusColor(value)}>
                <IonIcon icon={getTransportIcon(value)} />
                <span style={{ marginLeft: '4px', fontWeight: 'bold' }}>
                  {formatDistance(value)}
                </span>
              </IonChip>
            </div>
            <IonRange
              value={value}
              min={min}
              max={max}
              step={step}
              onIonInput={(e) => onChange(e.detail.value as number)}
              disabled={disabled}
              color={getRadiusColor(value)}
              style={{ paddingTop: '8px', paddingBottom: '8px' }}
            >
              <div slot="start" style={{ fontSize: '0.8rem', color: 'var(--ion-color-medium)' }}>
                {formatDistance(min)}
              </div>
              <div slot="end" style={{ fontSize: '0.8rem', color: 'var(--ion-color-medium)' }}>
                {formatDistance(max)}
              </div>
            </IonRange>
          </IonLabel>
        </div>
      </IonItem>

      <IonNote 
        style={{ 
          padding: '8px 16px', 
          display: 'block',
          textAlign: 'center',
          fontSize: '0.85rem'
        }}
      >
        <IonIcon icon={getTransportIcon(value)} style={{ marginRight: '4px' }} />
        {getWalkingTime(value)}
      </IonNote>

      {showPresets && (
        <div style={{ 
          padding: '8px 16px',
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap',
          justifyContent: 'center'
        }}>
          {presetValues.map((preset) => (
            <IonChip
              key={preset.value}
              outline={value !== preset.value}
              color={value === preset.value ? getRadiusColor(preset.value) : 'medium'}
              onClick={() => !disabled && handlePresetSelect(preset.value)}
              style={{ 
                cursor: disabled ? 'default' : 'pointer',
                opacity: disabled ? 0.5 : 1
              }}
            >
              {preset.label}
            </IonChip>
          ))}
        </div>
      )}

      <style>{`
        .radius-selector ion-range {
          --bar-height: 6px;
          --bar-background: var(--ion-color-light);
          --bar-background-active: var(--ion-color-primary);
          --knob-background: var(--ion-color-primary);
          --knob-size: 20px;
        }
        
        .radius-selector ion-range.range-success {
          --bar-background-active: var(--ion-color-success);
          --knob-background: var(--ion-color-success);
        }
        
        .radius-selector ion-range.range-warning {
          --bar-background-active: var(--ion-color-warning);
          --knob-background: var(--ion-color-warning);
        }
        
        .radius-selector ion-range.range-danger {
          --bar-background-active: var(--ion-color-danger);
          --knob-background: var(--ion-color-danger);
        }
      `}</style>
    </div>
  );
};

export default RadiusSelector;