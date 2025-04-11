import React from 'react';
import { IonContent } from '@ionic/react';
import LeaderboardList from './LeaderboardList';
import { Team } from '../../data/types';

interface LeaderboardTabProps {
  leaderboard: Team[];
  currentPlayerTeamId: string;
}

const LeaderboardTab: React.FC<LeaderboardTabProps> = ({ leaderboard, currentPlayerTeamId }) => {
  return (
    <>
      <IonContent>
        <LeaderboardList
          teams={leaderboard}
          currentPlayerTeamId={currentPlayerTeamId}
        />
      </IonContent>
    </>
  );
};

export default LeaderboardTab; 