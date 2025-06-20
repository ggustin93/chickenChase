import React from 'react';
import { IonCard, IonCardContent, IonTitle, IonButton, IonIcon, IonItemDivider, IonLabel, IonList, IonItem, IonInput } from '@ionic/react';
import { star, people, personAdd, add } from 'ionicons/icons';
import { Player, Team } from '../types/types';

interface TeamSelectionViewProps {
  teams: Team[];
  players: Player[];
  onJoinTeam: (teamId: string) => void;
  onBeChicken: () => void;
  isChickenTeamCreated: boolean;
  onHandleCreateTeam: () => void;
  newTeamName: string;
  setNewTeamName: (name: string) => void;
}

const TeamSelectionView: React.FC<TeamSelectionViewProps> = ({
  teams,
  players = [],
  onJoinTeam,
  onBeChicken,
  isChickenTeamCreated,
  onHandleCreateTeam,
  newTeamName,
  setNewTeamName,
}) => {
  const getPlayerCount = (teamId: string) => {
    if (!players || !Array.isArray(players)) return 0;
    return players.filter(p => p.team_id === teamId).length;
  };

  return (
    <>
      {!isChickenTeamCreated && (
        <IonCard color="warning" className="ion-margin-bottom ion-text-center">
          <IonCardContent>
            <IonTitle className="ion-padding-bottom">Prêt à être la star du jeu ?</IonTitle>
            <p className="ion-padding-bottom">L'équipe Poulet est la cible de tous les chasseurs. C'est un rôle à haut risque et haute récompense !</p>
            <IonButton size="large" onClick={onBeChicken}>
              <IonIcon icon={star} slot="start" />
              Devenir l'équipe Poulet!
            </IonButton>
          </IonCardContent>
        </IonCard>
      )}

      <IonItemDivider>
        <IonLabel>Ou Créer Votre Propre Équipe</IonLabel>
      </IonItemDivider>

      <IonCard className="ion-margin-top">
        <IonCardContent>
            <IonItem>
                <IonInput
                    label="Nom de votre équipe"
                    labelPlacement="floating"
                    value={newTeamName}
                    onIonChange={(e) => setNewTeamName(e.detail.value!)}
                ></IonInput>
            </IonItem>
            <IonButton expand="block" onClick={onHandleCreateTeam} className="ion-margin-top">
                <IonIcon icon={add} slot="start" />
                Créer l'équipe
            </IonButton>
        </IonCardContent>
      </IonCard>

      <IonItemDivider>
        <IonLabel>Choisir une Équipe</IonLabel>
      </IonItemDivider>
      
      <IonList inset={true}>
        {teams.map(team => (
          <IonItem key={team.id} lines="full" button onClick={() => onJoinTeam(team.id)} detail={false}>
            <IonIcon icon={team.is_chicken_team ? star : people} slot="start" color={team.is_chicken_team ? 'warning' : 'medium'} />
            <IonLabel>
              <h3>{team.name}</h3>
              <p>{getPlayerCount(team.id)} membre(s)</p>
            </IonLabel>
            <IonIcon icon={personAdd} slot="end" />
          </IonItem>
        ))}
      </IonList>
    </>
  );
};

export default TeamSelectionView;