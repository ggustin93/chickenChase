import {
  IonContent, IonPage, IonHeader, IonToolbar, IonButtons,
  IonBackButton, IonTitle, IonCard, IonCardHeader, IonCardTitle,
  IonCardContent, IonItem, IonInput, IonButton, IonIcon,
  useIonToast, IonLoading, IonLabel, IonNote, IonToggle, IonText,
  IonList, IonListHeader, IonChip, IonSegment, IonSegmentButton,
  IonBadge, IonGrid, IonRow, IonCol
} from '@ionic/react';
import { gameControllerOutline, cashOutline, peopleOutline, timeOutline, mapOutline, linkOutline, closeCircleOutline, locationOutline, searchOutline, addOutline } from 'ionicons/icons';
import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useSession } from '../contexts/SessionContext';
import { PostgrestError } from '@supabase/supabase-js';
import { GoogleMapsImporter } from '../services/googleMapsImporter';
import { Bar } from '../data/types';
import { GameBarService } from '../services/gameBarService';
import { OpenStreetMapService } from '../services/openStreetMapService';
import { initializeChallenges } from '../utils/databaseInit';
import { useGeolocation } from '../hooks/useGeolocation';
import AddressInput from '../components/shared/AddressInput';
import RadiusSelector from '../components/shared/RadiusSelector';

interface GameConfig {
  hostNickname: string;
  cagnotteInitial: number;
  maxTeams?: number;
  gameDuration?: number;
  googleMapsUrl?: string;
}

const CreateGamePage: React.FC = () => {
  const [config, setConfig] = useState<GameConfig>({
    hostNickname: '',
    cagnotteInitial: 50, // En euros pour l'interface utilisateur
    maxTeams: undefined,
    gameDuration: 120,
    googleMapsUrl: ''
  });
  
  // Validation states following Ionic React best practices
  const [hostNicknameTouched, setHostNicknameTouched] = useState(false);
  const [cagnotteTouched, setCagnotteTouched] = useState(false);
  const [isHostNicknameValid, setIsHostNicknameValid] = useState<boolean>();
  const [isCagnotteValid, setIsCagnotteValid] = useState<boolean>();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading, setLoading] = useState(false);
  const [importingBars, setImportingBars] = useState(false);
  const [importedBarsCount, setImportedBarsCount] = useState(0);
  const [importedBars, setImportedBars] = useState<Bar[]>([]);
  const [importMethod, setImportMethod] = useState<'link' | 'search'>('search');
  const [searchLocation, setSearchLocation] = useState('Rue Kessels 32, 1030 Schaerbeek, Bruxelles');
  const [searchRadius, setSearchRadius] = useState(1000);
  const [searchCoordinates, setSearchCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const history = useHistory();
  const { setSession } = useSession();
  const [present] = useIonToast();
  
  // Geolocation hook for current location functionality
  const { 
    getCurrentLocation, 
    currentPosition, 
    isGettingPosition, 
    error: locationError 
  } = useGeolocation();

  const handleRemoveBar = (barId: string) => {
    const updatedBars = importedBars.filter(bar => bar.id !== barId);
    setImportedBars(updatedBars);
    setImportedBarsCount(updatedBars.length);
    
    if (updatedBars.length === 0) {
      present({
        message: 'Tous les bars ont été supprimés.',
        duration: 2000,
        color: 'warning'
      });
    }
  };

  const handleClearAllBars = () => {
    setImportedBars([]);
    setImportedBarsCount(0);
    setConfig(prev => ({ ...prev, googleMapsUrl: '' }));
    present({
      message: 'Liste des bars effacée.',
      duration: 2000,
      color: 'warning'
    });
  };

  const handleUseCurrentLocation = async () => {
    try {
      await getCurrentLocation();
      
      if (currentPosition?.coords) {
        const { latitude, longitude } = currentPosition.coords;
        setSearchCoordinates({ lat: latitude, lng: longitude });
        setSearchLocation('Position actuelle');
        
        present({
          message: 'Position actuelle utilisée pour la recherche',
          duration: 2000,
          color: 'success'
        });
      }
    } catch (error) {
      console.error('Error getting current location:', error);
      present({
        message: 'Impossible d\'obtenir votre position actuelle',
        duration: 3000,
        color: 'warning'
      });
    }
  };

  const handleFixAddresses = async () => {
    setImportingBars(true);
    
    try {
      const { AddressService } = await import('../services/addressService');
      let fixedCount = 0;
      const updatedBars = [...importedBars];
      
      for (let i = 0; i < updatedBars.length; i++) {
        const bar = updatedBars[i];
        
        if (bar.address === 'Adresse non disponible' && bar.latitude && bar.longitude) {
          try {
            const newAddress = await AddressService.reverseGeocode(bar.latitude, bar.longitude);
            
            if (newAddress) {
              updatedBars[i] = { ...bar, address: newAddress };
              fixedCount++;
            }
            
            // Petite pause pour respecter les limites de l'API
            await new Promise(resolve => setTimeout(resolve, 100));
          } catch (error) {
            console.warn(`Erreur lors de la correction de l'adresse pour ${bar.name}:`, error);
          }
        }
      }
      
      setImportedBars(updatedBars);
      
      if (fixedCount > 0) {
        present({
          message: `${fixedCount} adresse${fixedCount > 1 ? 's' : ''} corrigée${fixedCount > 1 ? 's' : ''} !`,
          duration: 3000,
          color: 'success'
        });
      } else {
        present({
          message: 'Aucune adresse n\'a pu être corrigée.',
          duration: 3000,
          color: 'warning'
        });
      }
    } catch (error) {
      console.error('Erreur lors de la correction des adresses:', error);
      present({
        message: 'Erreur lors de la correction des adresses.',
        duration: 3000,
        color: 'danger'
      });
    } finally {
      setImportingBars(false);
    }
  };

  const handleAddressChange = (address: string, coordinates?: { lat: number; lng: number }) => {
    setSearchLocation(address);
    if (coordinates) {
      setSearchCoordinates(coordinates);
    } else {
      setSearchCoordinates(null);
    }
  };

  const handleSearchNearbyBars = async () => {
    setImportingBars(true);

    try {
      let location = searchCoordinates;
      
      // Si pas de coordonnées, géocoder l'adresse
      if (!location) {
        location = await OpenStreetMapService.geocodeAddress(searchLocation);
        
        if (!location) {
          present({
            message: 'Impossible de trouver cette localisation.',
            duration: 3000,
            color: 'warning'
          });
          return;
        }
      }

      // Rechercher les bars autour de cette position
      const places = await OpenStreetMapService.searchBarsNearLocation(
        location.lat,
        location.lng,
        searchRadius
      );

      if (places.length === 0) {
        present({
          message: 'Aucun bar trouvé dans cette zone.',
          duration: 3000,
          color: 'warning'
        });
        return;
      }

      // Convertir en bars et ajouter à la liste existante
      const newBars = await GoogleMapsImporter.convertPlacesToBars(places);
      const uniqueBars = [...importedBars];
      
      // Éviter les doublons
      newBars.forEach(newBar => {
        if (!uniqueBars.some(bar => bar.name === newBar.name && bar.address === newBar.address)) {
          uniqueBars.push(newBar);
        }
      });

      setImportedBars(uniqueBars);
      setImportedBarsCount(uniqueBars.length);

      present({
        message: `${places.length} bar${places.length > 1 ? 's' : ''} trouvé${places.length > 1 ? 's' : ''} !`,
        duration: 3000,
        color: 'success'
      });
    } catch (error) {
      console.error('Erreur lors de la recherche:', error);
      present({
        message: 'Erreur lors de la recherche de bars.',
        duration: 3000,
        color: 'danger'
      });
    } finally {
      setImportingBars(false);
    }
  };


  const handleImportFromGoogleMaps = async () => {
    if (!config.googleMapsUrl?.trim()) {
      present({
        message: 'Veuillez entrer un lien Google Maps valide.',
        duration: 3000,
        color: 'warning'
      });
      return;
    }

    if (!GoogleMapsImporter.isValidGoogleMapsUrl(config.googleMapsUrl)) {
      present({
        message: 'Format de lien Google Maps invalide.',
        duration: 3000,
        color: 'warning'
      });
      return;
    }

    setImportingBars(true);

    try {
      const result = await GoogleMapsImporter.importBarsFromGoogleMapsLink(
        config.googleMapsUrl,
        true, // Filter bars only
        1000 // 1km radius
      );

      if (result.success && result.bars.length > 0) {
        setImportedBarsCount(result.bars.length);
        setImportedBars(result.bars);
        
        let message = `${result.bars.length} bar${result.bars.length > 1 ? 's' : ''} importé${result.bars.length > 1 ? 's' : ''} avec succès !`;
        if (result.skipped > 0) {
          message += ` (${result.skipped} établissement${result.skipped > 1 ? 's' : ''} non-bar ignoré${result.skipped > 1 ? 's' : ''})`;
        }

        present({
          message,
          duration: 4000,
          color: 'success'
        });
      } else {
        present({
          message: result.errors.join(' ') || 'Aucun bar trouvé à importer.',
          duration: 4000,
          color: 'warning'
        });
        setImportedBarsCount(0);
        setImportedBars([]);
      }
    } catch (error) {
      console.error('Erreur lors de l\'import:', error);
      present({
        message: 'Erreur lors de l\'importation depuis Google Maps.',
        duration: 3000,
        color: 'danger'
      });
      setImportedBarsCount(0);
      setImportedBars([]);
    } finally {
      setImportingBars(false);
    }
  };

  // Validation functions following Ionic React patterns
  const validateHostNickname = (value: string) => {
    const isValid = value.trim().length >= 2;
    setIsHostNicknameValid(isValid);
    return isValid;
  };

  const validateCagnotte = (value: number) => {
    const isValid = value >= 0 && value <= 1000;
    setIsCagnotteValid(isValid);
    return isValid;
  };

  const markHostNicknameTouched = () => {
    setHostNicknameTouched(true);
  };

  const markCagnotteTouched = () => {
    setCagnotteTouched(true);
  };

  // Comprehensive form validation without triggering state updates
  const isFormValid = () => {
    const isNicknameValid = config.hostNickname.trim().length >= 2;
    const isCagnotteValidValue = config.cagnotteInitial >= 0 && config.cagnotteInitial <= 1000;
    const hasBars = importedBars.length > 0;
    
    return isNicknameValid && isCagnotteValidValue && hasBars;
  };

  const handleCreateGame = async () => {
    // Mark fields as touched for validation display
    markHostNicknameTouched();
    markCagnotteTouched();
    
    // Trigger validation
    validateHostNickname(config.hostNickname);
    validateCagnotte(config.cagnotteInitial);
    
    // Use Ionic validation pattern
    if (!isFormValid()) {
      if (!config.hostNickname.trim()) {
        present({
          message: '📝 Votre pseudo doit contenir au moins 2 caractères.',
          duration: 3000,
          color: 'warning',
          position: 'top'
        });
        return;
      }

      if (config.cagnotteInitial < 0 || config.cagnotteInitial > 1000) {
        present({
          message: '💰 La cagnotte doit être entre 0€ et 1000€.',
          duration: 3000,
          color: 'warning',
          position: 'top'
        });
        return;
      }

      if (importedBars.length === 0) {
        present({
          message: '🍺 Vous devez ajouter au moins un bar pour créer la partie !',
          duration: 4000,
          color: 'danger',
          position: 'top'
        });
        return;
      }
    }

    if (importedBars.length < 3) {
      present({
        message: '⚠️ Recommandation : Ajoutez au moins 3 bars pour une meilleure expérience de jeu',
        duration: 4000,
        color: 'warning',
        position: 'top'
      });
    }

    setLoading(true);

    try {
      // Appeler la fonction create_game_and_host qui fonctionne sans auth
      const { data, error } = await supabase.rpc('create_game_and_host', {
        host_nickname: config.hostNickname.trim(),
        cagnotte_initial: config.cagnotteInitial * 100, // Convertir en centimes
        max_teams: config.maxTeams || null,
        game_duration: config.gameDuration || 120
      });

      if (error || !data) {
        console.error('Error calling create_game_and_host:', error);
        throw new Error(error?.message || "Impossible de créer la partie. Le majordome a échoué !");
      }
      
      if (!data.success) {
        throw new Error("La création de partie a échoué.");
      }

      const { game_id, player_id, join_code } = data;

      // Essayer l'authentification anonyme si disponible (optionnel)
      try {
        const { data: authData, error: authError } = await supabase.auth.signInAnonymously();
        
        if (!authError && authData.user) {
          // Lier l'utilisateur authentifié au joueur créé
          const { error: updatePlayerError } = await supabase
            .from('players')
            .update({ user_id: authData.user.id })
            .eq('id', player_id);

          if (updatePlayerError) {
            console.warn('Warning updating player user_id:', updatePlayerError);
          }
        }
      } catch (authError) {
        console.warn('Auth not available, continuing without:', authError);
        // L'app fonctionne en mode session localStorage même sans auth
      }

      // Configurer la session
      setSession({ 
        playerId: player_id, 
        gameId: game_id, 
        nickname: config.hostNickname.trim(),
        teamId: null
      });

      // Initialize challenges if not already done
      const challengeInit = await initializeChallenges();
      if (!challengeInit.success) {
        console.warn('Failed to initialize challenges:', challengeInit.message);
        // Continue anyway, challenges can be added manually later
      } else {
        console.log('Challenges initialized:', challengeInit.message);
      }

      // Sauvegarder les bars (OBLIGATOIRE)
      present({
        message: '🍺 Sauvegarde des bars importés...',
        duration: 2000,
        color: 'secondary'
      });

      const importResult = await GameBarService.importBarsToGame(game_id, importedBars);
      
      if (!importResult.success) {
        throw new Error('Impossible de sauvegarder les bars pour la partie');
      }

      present({
        message: `🎉 Partie créée ! Code: ${join_code} - ${importResult.count} bars ajoutés`,
        duration: 5000,
        color: 'success'
      });

      // Naviguer vers le lobby
      history.push(`/lobby/${game_id}`);

    } catch (error) {
      console.error('Erreur lors de la création de la partie:', error);
      let message = 'Une erreur inconnue est survenue.';
      if (error instanceof PostgrestError) {
        message = `Erreur: ${error.message}`;
      } else if (error instanceof Error) {
        message = error.message;
      }
      present({
        message: message,
        duration: 3000,
        color: 'danger'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/" />
          </IonButtons>
          <IonTitle>Créer une Partie</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="ion-padding">
        <IonLoading isOpen={loading} message={'Création de la partie...'} />
        
        <div className="flex flex-col items-center min-h-full py-2 px-2">
          {/* Header Card avec design amélioré */}
          <IonCard className="w-full max-w-lg mx-auto mb-4 bg-gradient-to-br from-blue-50 to-indigo-100 border-0 shadow-lg">
            <IonCardHeader className="pb-2">
              <IonCardTitle className="ion-text-center text-2xl font-bold text-gray-800">
                <IonIcon icon={gameControllerOutline} className="text-blue-600 mr-2" /> 
                Nouvelle Partie
              </IonCardTitle>
            </IonCardHeader>
            <IonCardContent className="pt-0">
              <form style={{ width: '100%' }}>
                {/* Pseudo organisateur - REQUIS avec validation Ionic */}
                <IonItem 
                  className={`mb-4 ${
                    isHostNicknameValid ? 'ion-valid' : ''
                  } ${
                    isHostNicknameValid === false ? 'ion-invalid' : ''
                  } ${
                    hostNicknameTouched ? 'ion-touched' : ''
                  }`} 
                  style={{ width: '100%' }}
                >
                  <IonInput
                    label="Votre pseudo"
                    labelPlacement="floating"
                    value={config.hostNickname}
                    onIonInput={(e) => {
                      const value = e.detail.value!;
                      setConfig(prev => ({ ...prev, hostNickname: value }));
                      if (hostNicknameTouched) {
                        validateHostNickname(value);
                      }
                    }}
                    onIonBlur={() => {
                      markHostNicknameTouched();
                      validateHostNickname(config.hostNickname);
                    }}
                    clearInput
                    required
                    placeholder="Ex: Alex"
                    style={{ width: '100%' }}
                    helperText="Minimum 2 caractères requis"
                    errorText="Le pseudo doit contenir au moins 2 caractères"
                  />
                </IonItem>

                {/* Cagnotte initiale - REQUIS avec validation Ionic */}
                <IonItem 
                  className={`mb-4 ${
                    isCagnotteValid ? 'ion-valid' : ''
                  } ${
                    isCagnotteValid === false ? 'ion-invalid' : ''
                  } ${
                    cagnotteTouched ? 'ion-touched' : ''
                  }`} 
                  style={{ width: '100%' }}
                >
                  <IonIcon icon={cashOutline} slot="start" />
                  <IonInput
                    label="Cagnotte initiale (€)"
                    labelPlacement="floating"
                    type="number"
                    min="0"
                    max="1000"
                    step="5"
                    value={config.cagnotteInitial}
                    onIonInput={(e) => {
                      const value = parseFloat(e.detail.value!) || 0;
                      setConfig(prev => ({ ...prev, cagnotteInitial: value }));
                      if (cagnotteTouched) {
                        validateCagnotte(value);
                      }
                    }}
                    onIonBlur={() => {
                      markCagnotteTouched();
                      validateCagnotte(config.cagnotteInitial);
                    }}
                    required
                    style={{ width: '100%' }}
                    helperText="Montant entre 0€ et 1000€ pour les consommations"
                    errorText="La cagnotte doit être entre 0€ et 1000€"
                  />
                </IonItem>

                {/* Import de bars - OBLIGATOIRE */}
                <IonCard className="mb-4 border-2 border-dashed border-orange-300 bg-orange-50" style={{ margin: '16px 0' }}>
                  <IonCardHeader className="pb-2">
                    <IonCardTitle className="text-lg flex items-center justify-between">
                      <div className="flex items-center">
                        <IonIcon icon={mapOutline} className="mr-2 text-orange-600" />
                        Ajouter des bars
                      </div>
                      <div className="flex items-center text-sm">
                        {importedBars.length === 0 ? (
                          <IonChip color="danger" className="text-xs">
                            <IonIcon icon={addOutline} />
                            Requis
                          </IonChip>
                        ) : (
                          <IonChip color="success" className="text-xs">
                            ✅ {importedBars.length} bar{importedBars.length > 1 ? 's' : ''}
                          </IonChip>
                        )}
                      </div>
                    </IonCardTitle>
                    {importedBars.length === 0 && (
                      <IonNote className="text-orange-700 text-sm">
                        🍺 Vous devez ajouter au moins un bar pour créer la partie
                      </IonNote>
                    )}
                  </IonCardHeader>
                  <IonCardContent>
                    {/* Onglets pour les différentes méthodes */}
                    <IonSegment 
                      value={importMethod} 
                      onIonChange={(e) => setImportMethod(e.detail.value as 'link' | 'search')}
                      className="mb-4"
                    >
                      <IonSegmentButton value="link">
                        <IonIcon icon={linkOutline} />
                        <IonLabel>Lien Google Maps</IonLabel>
                      </IonSegmentButton>
                      <IonSegmentButton value="search">
                        <IonIcon icon={searchOutline} />
                        <IonLabel>Recherche locale</IonLabel>
                      </IonSegmentButton>
                    </IonSegment>

                    {/* Contenu selon l'onglet sélectionné */}
                    {importMethod === 'link' && (
                      <div>
                        <IonItem className="mb-3">
                          <IonIcon icon={linkOutline} slot="start" />
                          <IonInput
                            label="Lien liste partagée Google Maps"
                            labelPlacement="floating"
                            value={config.googleMapsUrl}
                            onIonInput={(e) => setConfig(prev => ({ 
                              ...prev, 
                              googleMapsUrl: e.detail.value! 
                            }))}
                            clearInput
                            placeholder="https://maps.app.goo.gl/..."
                            style={{ width: '100%' }}
                          />
                        </IonItem>
                        
                        <IonButton
                          onClick={handleImportFromGoogleMaps}
                          expand="block"
                          fill="outline"
                          disabled={!config.googleMapsUrl?.trim() || importingBars}
                          size="default"
                        >
                          {importingBars ? (
                            <>
                              <IonIcon slot="start" icon={mapOutline} />
                              Importation...
                            </>
                          ) : (
                            <>
                              <IonIcon slot="start" icon={linkOutline} />
                              Importer
                            </>
                          )}
                        </IonButton>
                        
                        <IonNote className="text-center text-xs mt-2 block">
                          Copiez le lien d'une liste partagée Google Maps
                        </IonNote>
                      </div>
                    )}

                    {importMethod === 'search' && (
                      <div>
                        <AddressInput
                          value={searchLocation}
                          onAddressChange={handleAddressChange}
                          onCurrentLocation={handleUseCurrentLocation}
                          placeholder="Bruxelles, Place Eugène Flagey..."
                          label="Ville ou adresse"
                          className="mb-3"
                          showCurrentLocationButton={true}
                          disabled={importingBars || isGettingPosition}
                        />

                        <RadiusSelector
                          value={searchRadius}
                          onChange={setSearchRadius}
                          min={100}
                          max={5000}
                          step={100}
                          disabled={importingBars}
                          showPresets={true}
                        />
                        
                        <IonButton
                          onClick={handleSearchNearbyBars}
                          expand="block"
                          fill="outline"
                          disabled={!searchLocation.trim() || importingBars}
                          size="default"
                        >
                          {importingBars ? (
                            <>
                              <IonIcon slot="start" icon={searchOutline} />
                              Recherche...
                            </>
                          ) : (
                            <>
                              <IonIcon slot="start" icon={searchOutline} />
                              Rechercher
                            </>
                          )}
                        </IonButton>
                        
                        <IonNote className="text-center text-xs mt-2 block">
                          Recherche via OpenStreetMap (gratuit)
                        </IonNote>
                      </div>
                    )}

                    {importedBarsCount > 0 && (
                      <IonText color="success" className="text-center text-sm mt-3 block">
                        ✅ {importedBarsCount} bar{importedBarsCount > 1 ? 's' : ''} ajouté{importedBarsCount > 1 ? 's' : ''}
                      </IonText>
                    )}

                  {/* Mobile-optimized bar list */}
                  {importedBars.length > 0 && (
                    <div className="mt-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">{importedBars.length} bar{importedBars.length > 1 ? 's' : ''}</span>
                        <IonButton 
                          fill="clear" 
                          size="small" 
                          color="danger"
                          onClick={handleClearAllBars}
                        >
                          Effacer
                        </IonButton>
                      </div>
                      
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {importedBars.slice(0, 3).map((bar, index) => (
                          <div key={bar.id || index} className="flex items-center justify-between bg-white rounded p-2 text-sm">
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">{bar.name}</div>
                              <div className="text-xs text-gray-500 truncate">{bar.address}</div>
                            </div>
                            <IonButton 
                              fill="clear" 
                              size="small"
                              color="medium"
                              onClick={() => handleRemoveBar(bar.id)}
                            >
                              <IonIcon icon={closeCircleOutline} />
                            </IonButton>
                          </div>
                        ))}
                        {importedBars.length > 3 && (
                          <div className="text-xs text-center text-gray-500">
                            +{importedBars.length - 3} autres bars
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Simple status indicator */}
                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span>État:</span>
                    <div className="flex items-center space-x-2">
                      <span className={isHostNicknameValid ? 'text-green-600' : 'text-gray-400'}>Pseudo</span>
                      <span className={importedBars.length > 0 ? 'text-green-600' : 'text-red-600'}>Bars ({importedBars.length})</span>
                      <span className={isCagnotteValid ? 'text-green-600' : 'text-gray-400'}>{config.cagnotteInitial}€</span>
                    </div>
                  </div>
                </div>

                <IonButton
                  onClick={handleCreateGame}
                  expand="block"
                  size="large"
                  disabled={loading || !isFormValid()}
                  color={(!config.hostNickname.trim() || importedBars.length === 0 || config.cagnotteInitial < 0) ? "medium" : "primary"}
                  className={`w-full mt-4 font-bold transition-all duration-300 ${
                    (!config.hostNickname.trim() || importedBars.length === 0 || config.cagnotteInitial < 0) ? 'opacity-60' : 'opacity-100'
                  }`}
                >
                  <IonIcon slot="start" icon={gameControllerOutline} />
                  {!config.hostNickname.trim() ? '📝 Complétez votre pseudo' : 
                   importedBars.length === 0 ? '🍺 Ajoutez des bars d\'abord' :
                   config.cagnotteInitial < 0 ? '💰 Cagnotte invalide' :
                   '🚀 Créer la Partie'}
                </IonButton>
              </form>

              {/* Informations d'aide améliorées */}
              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-center">
                  <IonNote className="text-blue-700 text-sm">
                    🎮 Un code de 6 caractères sera généré pour que les joueurs puissent rejoindre la partie.
                  </IonNote>
                </div>
                <div className="text-center mt-2">
                  <IonNote className="text-blue-600 text-xs">
                    💡 Tip: Ajoutez au moins 3 bars pour une meilleure expérience de jeu
                  </IonNote>
                </div>
              </div>
            </IonCardContent>
          </IonCard>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default CreateGamePage;