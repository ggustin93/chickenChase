import {
  IonContent, IonPage, IonHeader, IonToolbar, IonButtons,
  IonBackButton, IonTitle, IonCard, IonCardHeader, IonCardTitle,
  IonCardContent, IonItem, IonInput, IonButton, IonIcon,
  useIonToast, IonLoading, IonLabel, IonNote, IonToggle, IonText,
  IonList, IonListHeader, IonChip, IonSegment, IonSegmentButton
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
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading, setLoading] = useState(false);
  const [importingBars, setImportingBars] = useState(false);
  const [importedBarsCount, setImportedBarsCount] = useState(0);
  const [importedBars, setImportedBars] = useState<Bar[]>([]);
  const [importMethod, setImportMethod] = useState<'link' | 'search'>('link');
  const [searchLocation, setSearchLocation] = useState('Bruxelles');
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

  const handleCreateGame = async () => {
    if (!config.hostNickname.trim()) {
      present({
        message: 'Votre pseudo est requis pour créer une partie.',
        duration: 3000,
        color: 'warning'
      });
      return;
    }

    if (config.cagnotteInitial < 0) {
      present({
        message: 'La cagnotte ne peut pas être négative.',
        duration: 3000,
        color: 'warning'
      });
      return;
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

      // Si des bars ont été importés, les sauvegarder dans la base de données
      if (importedBars.length > 0) {
        present({
          message: 'Sauvegarde des bars importés...',
          duration: 2000,
          color: 'secondary'
        });

        const importResult = await GameBarService.importBarsToGame(game_id, importedBars);
        
        if (importResult.success) {
          present({
            message: `Partie créée ! Code: ${join_code} - ${importResult.count} bars ajoutés`,
            duration: 5000,
            color: 'success'
          });
        } else {
          // Avertir mais continuer quand même
          present({
            message: `Partie créée ! Code: ${join_code} (bars non sauvegardés)`,
            duration: 5000,
            color: 'warning'
          });
        }
      } else {
        // Afficher le code de partie créé
        present({
          message: `Partie créée ! Code: ${join_code}`,
          duration: 4000,
          color: 'success'
        });
      }

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
        
        <div className="flex flex-col items-center min-h-full py-4">
          <IonCard className="w-full max-w-md mx-auto">
            <IonCardHeader>
              <IonCardTitle className="ion-text-center text-2xl">
                <IonIcon icon={gameControllerOutline} /> Nouvelle Partie
              </IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <form style={{ width: '100%' }}>
                {/* Pseudo organisateur - REQUIS */}
                <IonItem className="mb-4" style={{ width: '100%' }}>
                  <IonInput
                    label="Votre pseudo"
                    labelPlacement="floating"
                    value={config.hostNickname}
                    onIonInput={(e) => setConfig(prev => ({ ...prev, hostNickname: e.detail.value! }))}
                    clearInput
                    required
                    placeholder="Ex: Alex"
                    style={{ width: '100%' }}
                  />
                </IonItem>

                {/* Cagnotte initiale - REQUIS */}
                <IonItem className="mb-4" style={{ width: '100%' }}>
                  <IonIcon icon={cashOutline} slot="start" />
                  <IonInput
                    label="Cagnotte initiale (€)"
                    labelPlacement="floating"
                    type="number"
                    min="0"
                    step="5"
                    value={config.cagnotteInitial}
                    onIonInput={(e) => setConfig(prev => ({ 
                      ...prev, 
                      cagnotteInitial: parseFloat(e.detail.value!) || 0 
                    }))}
                    required
                    style={{ width: '100%' }}
                  />
                  <IonNote slot="helper">Montant total pour les consommations du poulet</IonNote>
                </IonItem>

                {/* Import de bars - OPTIONNEL */}
                <IonCard className="mb-4" style={{ margin: '16px 0' }}>
                  <IonCardHeader>
                    <IonCardTitle className="text-lg flex items-center">
                      <IonIcon icon={mapOutline} className="mr-2" />
                      Ajouter des bars
                    </IonCardTitle>
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

                    {/* Liste des bars importés */}
                    {importedBars.length > 0 && (
                      <div className="mt-4">
                        <div className="flex justify-between items-center mb-2">
                          <IonListHeader className="px-0">
                            <IonLabel className="text-sm font-semibold">
                              Bars importés ({importedBars.length}) :
                            </IonLabel>
                          </IonListHeader>
                          <IonButton 
                            fill="clear" 
                            size="small" 
                            color="danger"
                            onClick={handleClearAllBars}
                          >
                            Tout effacer
                          </IonButton>
                        </div>
                        <IonList className="rounded-lg overflow-hidden border border-gray-200">
                          {importedBars.map((bar, index) => (
                            <IonItem key={bar.id || index} lines={index === importedBars.length - 1 ? 'none' : 'inset'}>
                              <IonIcon 
                                icon={locationOutline} 
                                slot="start" 
                                color="primary" 
                                className="text-lg"
                              />
                              <div className="flex-1 py-2">
                                <div className="font-medium text-sm">{bar.name}</div>
                                <div className="text-xs text-gray-500">{bar.address}</div>
                                {bar.description && (
                                  <div className="text-xs text-primary mt-1">
                                    {bar.description}
                                  </div>
                                )}
                              </div>
                              <IonButton 
                                fill="clear" 
                                slot="end" 
                                color="medium"
                                onClick={() => handleRemoveBar(bar.id)}
                              >
                                <IonIcon icon={closeCircleOutline} />
                              </IonButton>
                            </IonItem>
                          ))}
                        </IonList>
                        <IonNote className="text-xs mt-2 block text-center">
                          Ces bars seront utilisés comme lieux à visiter dans le jeu
                        </IonNote>
                      </div>
                    )}
                  </IonCardContent>
                </IonCard>

                {/* Toggle pour paramètres avancés */}
                <IonItem className="mb-4">
                  <IonLabel>Paramètres avancés</IonLabel>
                  <IonToggle 
                    checked={showAdvanced} 
                    onIonChange={(e) => setShowAdvanced(e.detail.checked)}
                  />
                </IonItem>

                {/* Paramètres avancés - OPTIONNELS */}
                {showAdvanced && (
                  <>
                    <IonItem className="mb-4" style={{ width: '100%' }}>
                      <IonIcon icon={peopleOutline} slot="start" />
                      <IonInput
                        label="Limite d'équipes"
                        labelPlacement="floating"
                        type="number"
                        min="1"
                        value={config.maxTeams}
                        onIonInput={(e) => setConfig(prev => ({ 
                          ...prev, 
                          maxTeams: e.detail.value ? parseInt(e.detail.value) : undefined
                        }))}
                        clearInput
                        placeholder="Illimité"
                        style={{ width: '100%' }}
                      />
                      <IonNote slot="helper">Laisser vide pour aucune limite</IonNote>
                    </IonItem>

                    <IonItem className="mb-6" style={{ width: '100%' }}>
                      <IonIcon icon={timeOutline} slot="start" />
                      <IonInput
                        label="Durée de partie (minutes)"
                        labelPlacement="floating"
                        type="number"
                        min="30"
                        max="480"
                        value={config.gameDuration}
                        onIonInput={(e) => setConfig(prev => ({ 
                          ...prev, 
                          gameDuration: parseInt(e.detail.value!) || 120
                        }))}
                        required
                        style={{ width: '100%' }}
                      />
                      <IonNote slot="helper">Recommandé: 120 minutes (2h)</IonNote>
                    </IonItem>
                  </>
                )}

                <IonButton
                  onClick={handleCreateGame}
                  expand="block"
                  size="large"
                  disabled={!config.hostNickname.trim() || loading}
                  style={{ width: '100%', marginTop: '16px' }}
                >
                  <IonIcon slot="start" icon={gameControllerOutline} />
                  Créer la Partie
                </IonButton>
              </form>

              {/* Informations d'aide */}
              <div className="ion-margin-top ion-text-center">
                <IonNote>
                  Un code de 6 caractères sera généré pour que les joueurs puissent rejoindre la partie.
                </IonNote>
              </div>
            </IonCardContent>
          </IonCard>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default CreateGamePage;