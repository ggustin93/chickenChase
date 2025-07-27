/**
 * Reusable address input component with autocomplete functionality
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  IonItem,
  IonInput,
  IonIcon,
  IonList,
  IonButton,
  IonNote,
  IonSpinner
} from '@ionic/react';
import { locationOutline, navigateOutline, checkmarkCircle } from 'ionicons/icons';
import { useAddressAutocomplete } from '../../hooks/useAddressAutocomplete';
import { AddressSuggestion } from '../../services/AddressAutocompleteService';

interface AddressInputProps {
  value: string;
  onAddressChange: (address: string, coordinates?: { lat: number; lng: number }) => void;
  onCurrentLocation?: () => void;
  placeholder?: string;
  label?: string;
  className?: string;
  showCurrentLocationButton?: boolean;
  disabled?: boolean;
}

const AddressInput: React.FC<AddressInputProps> = ({
  value,
  onAddressChange,
  onCurrentLocation,
  placeholder = "Entrez une adresse...",
  label = "Adresse",
  className = "",
  showCurrentLocationButton = true,
  disabled = false
}) => {
  const [inputValue, setInputValue] = useState(value);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLIonInputElement>(null);

  const {
    suggestions,
    loading,
    error,
    searchSuggestions,
    clearSuggestions,
    selectSuggestion
  } = useAddressAutocomplete({
    minLength: 3,
    debounceMs: 300,
    maxSuggestions: 5
  });

  // Update internal state when external value changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleInputChange = (inputValue: string) => {
    setInputValue(inputValue);
    setShowSuggestions(true);
    
    if (inputValue.length >= 3) {
      searchSuggestions(inputValue);
    } else {
      clearSuggestions();
    }
    
    // Notify parent of text change (without coordinates)
    onAddressChange(inputValue);
  };

  const handleSuggestionSelect = (suggestion: AddressSuggestion) => {
    const result = selectSuggestion(suggestion);
    setInputValue(result.address);
    setShowSuggestions(false);
    
    // Notify parent with coordinates
    onAddressChange(result.address, result.coordinates);
  };

  const handleInputFocus = () => {
    if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleInputBlur = () => {
    // Delay hiding suggestions to allow for selection
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
  };

  const handleCurrentLocation = () => {
    if (onCurrentLocation) {
      onCurrentLocation();
      setShowSuggestions(false);
    }
  };

  return (
    <div className={`address-input-container ${className}`}>
      <IonItem>
        <IonIcon icon={locationOutline} slot="start" />
        <IonInput
          ref={inputRef}
          label={label}
          labelPlacement="floating"
          value={inputValue}
          onIonInput={(e) => handleInputChange(e.detail.value!)}
          onIonFocus={handleInputFocus}
          onIonBlur={handleInputBlur}
          placeholder={placeholder}
          clearInput
          disabled={disabled}
          style={{ width: '100%' }}
        />
        {showCurrentLocationButton && onCurrentLocation && (
          <IonButton
            fill="clear"
            slot="end"
            size="small"
            onClick={handleCurrentLocation}
            disabled={disabled}
          >
            <IonIcon icon={navigateOutline} />
          </IonButton>
        )}
        {loading && (
          <IonSpinner name="crescent" slot="end" />
        )}
      </IonItem>

      {error && (
        <IonNote color="danger" className="ion-padding-start">
          {error}
        </IonNote>
      )}

      {showSuggestions && suggestions.length > 0 && (
        <IonList className="address-suggestions">
          {suggestions.map((suggestion, index) => (
            <IonItem
              key={`${suggestion.osm_type}_${suggestion.osm_id}`}
              button
              onClick={() => handleSuggestionSelect(suggestion)}
              style={{ 
                fontSize: '0.9rem',
                '--min-height': '40px',
                borderBottom: index === suggestions.length - 1 ? 'none' : '1px solid var(--ion-color-light)'
              }}
            >
              <IonIcon 
                icon={checkmarkCircle} 
                slot="start" 
                color="medium" 
              />
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column',
                gap: '2px',
                paddingTop: '4px',
                paddingBottom: '4px'
              }}>
                <div style={{ 
                  fontWeight: '500',
                  color: 'var(--ion-color-dark)',
                  fontSize: '0.9rem'
                }}>
                  {suggestion.address.road && suggestion.address.house_number 
                    ? `${suggestion.address.house_number} ${suggestion.address.road}`
                    : suggestion.address.road || suggestion.display_name.split(',')[0]
                  }
                </div>
                <div style={{ 
                  fontSize: '0.8rem',
                  color: 'var(--ion-color-medium)',
                  marginTop: '2px'
                }}>
                  {[
                    suggestion.address.postcode,
                    suggestion.address.city || suggestion.address.town || suggestion.address.village,
                    suggestion.address.country
                  ].filter(Boolean).join(', ')}
                </div>
              </div>
            </IonItem>
          ))}
        </IonList>
      )}

      <style>{`
        .address-suggestions {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          z-index: 1000;
          background: var(--ion-color-light);
          border: 1px solid var(--ion-color-medium);
          border-radius: 8px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
          max-height: 200px;
          overflow-y: auto;
        }
        
        .address-input-container {
          position: relative;
        }
      `}</style>
    </div>
  );
};

export default AddressInput;