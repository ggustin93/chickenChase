import React from 'react';
import { IonHeader, IonToolbar, IonTitle, IonIcon } from '@ionic/react';
import { person, people } from 'ionicons/icons';
import { useSession } from '../../contexts/SessionContext';
import './UserInfoHeader.css';

interface UserInfoHeaderProps {
  /** Total number of players in the game */
  totalPlayers: number;
  /** Optional additional info to display */
  additionalInfo?: string;
  /** Custom class for styling */
  className?: string;
  /** User's team name if applicable */
  teamName?: string;
}

const UserInfoHeader: React.FC<UserInfoHeaderProps> = ({ 
  totalPlayers = 0, 
  additionalInfo,
  className = '',
  teamName 
}) => {
  const { session } = useSession();

  // Debug: uncomment to check data
  // console.log('UserInfoHeader data:', { 
  //   nickname: session.nickname, 
  //   totalPlayers, 
  //   teamName,
  //   additionalInfo 
  // });

  return (
    <IonHeader className={`user-info-ion-header ${className}`}>
      <IonToolbar className="user-info-toolbar">
        <IonTitle className="user-info-title">
          {/* Ultra-compact horizontal layout like Lobby */}
          <div className="compact-stats-row">
            <div className="stat-simple">
              <IonIcon icon={person} />
              <span>{session.nickname || 'Joueur'}</span>
            </div>
            <div className="stat-divider">•</div>
            <div className="stat-simple">
              <IonIcon icon={people} />
              <span>{totalPlayers || 0}</span>
            </div>
            {teamName && (
              <>
                <div className="stat-divider">•</div>
                <div className="stat-simple">
                  <span>{teamName}</span>
                </div>
              </>
            )}
          </div>
        </IonTitle>
      </IonToolbar>
    </IonHeader>
  );
};

export default UserInfoHeader;