import React, { useState, useEffect } from 'react';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  IonSearchbar,
  IonContent,
  IonList,
  IonItem,
  IonThumbnail,
  IonLabel,
  IonModal,
} from '@ionic/react';
import { closeOutline, checkmarkCircleOutline } from 'ionicons/icons';
import { Bar } from '../../data/types';

interface SelectHidingSpotModalProps {
  isOpen: boolean;
  barOptions: Bar[];
  currentBar: Bar | null;
  onClose: () => void;
  onSelectBar: (barId: string) => void;
}

const SelectHidingSpotModal: React.FC<SelectHidingSpotModalProps> = (
  { isOpen, barOptions, currentBar, onClose, onSelectBar }
) => {
  const [searchTextModal, setSearchTextModal] = useState('');

  const filteredBars = barOptions.filter(bar => 
    !searchTextModal || bar.name.toLowerCase().includes(searchTextModal.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      setSearchTextModal('');
    }
  }, [isOpen]);

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Choisir ma cachette</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={onClose}>
              <IonIcon slot="icon-only" icon={closeOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
        <IonToolbar>
          <IonSearchbar
            placeholder="Rechercher un bar..."
            value={searchTextModal}
            onIonChange={e => setSearchTextModal(e.detail.value || '')}
            className="modal-search-bar"
          />
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonList lines="full">
          {filteredBars.map(bar => {
            const isCurrent = currentBar?.id === bar.id;
            return (
              <IonItem 
                key={bar.id} 
                button 
                onClick={() => {
                  onSelectBar(bar.id);
                  onClose();
                }}
                detail={false} 
                color={isCurrent ? 'light' : undefined}
              >
                <IonThumbnail slot="start" className="bar-thumbnail-modal">
                  <img 
                    alt={bar.name} 
                    src={bar.photoUrl || 'https://ionicframework.com/docs/img/demos/thumbnail.svg'} 
                    onError={(e) => (e.currentTarget.src = 'https://ionicframework.com/docs/img/demos/thumbnail.svg')} 
                  />
                </IonThumbnail>
                <IonLabel className="ion-text-wrap">
                  <h2 className={isCurrent ? 'font-bold' : ''}>{bar.name}</h2> 
                  <p className="text-xs text-medium">{bar.address}</p>
                </IonLabel>
                {isCurrent && (
                  <IonIcon slot="end" icon={checkmarkCircleOutline} color="success" />
                )}
              </IonItem>
            );
          })}
          {filteredBars.length === 0 && (
            <IonItem lines="none">
              <IonLabel className="ion-text-center ion-padding">
                <p className="text-medium">Aucun bar correspondant trouvé.</p>
              </IonLabel>
            </IonItem>
          )}
        </IonList>
      </IonContent>
    </IonModal>
  );
};

export default SelectHidingSpotModal; 