import React from 'react';
import { IonCard, IonCardContent, IonIcon, IonRippleEffect } from '@ionic/react';
import { trophyOutline, timeOutline, beerOutline, flagOutline } from 'ionicons/icons';
// Remove unused Team import
// import { Team } from '../../data/types';
import CagnotteSection from '../shared/CagnotteSection';
import './PlayerGameStatusCard.css';

interface PlayerGameStatusCardProps {
  // Remove unused team prop
  // team: Team;
  score: number;
  gameTime: string;
  barsVisited: number;
  totalBars: number;
  challengesCompleted: number;
  totalChallenges: number;
  cagnotteCurrentAmount?: number;
  cagnotteInitialAmount?: number;
  isCagnotteLoading?: boolean;
  onCagnotteConsumption?: (amount: number, reason: string) => void;
}

const PlayerGameStatusCard: React.FC<PlayerGameStatusCardProps> = ({
  // Remove unused team prop from destructuring
  // team,
  score,
  gameTime,
  barsVisited,
  totalBars,
  challengesCompleted,
  totalChallenges,
  cagnotteCurrentAmount,
  cagnotteInitialAmount,
  isCagnotteLoading,
  onCagnotteConsumption
}) => {
  const isTimeCritical = gameTime.includes('0:') || gameTime.includes('00:');
  // Remove unused percentage calculations
  // const barsProgressPercent = totalBars > 0 ? (barsVisited / totalBars) * 100 : 0;
  // const challengesProgressPercent = totalChallenges > 0 ? (challengesCompleted / totalChallenges) * 100 : 0;
  
  return (
    <IonCard className="player-status-card ion-activatable compact-status-card">
      <IonCardContent className="player-status-content compact-content">
        
        <div className="status-grid">
          {/* Top Row: Score & Time */}
          <div className="stat-item score-item">
            <IonIcon icon={trophyOutline} />
            <div className="stat-details">
              <div className="stat-value">{score} pts</div>
              <div className="stat-label">Score</div>
            </div>
          </div>
          
          <div className={`stat-item time-item ${isTimeCritical ? 'critical' : ''}`}>
            <IonIcon icon={timeOutline} />
            <div className="stat-details">
              <div className="stat-value">{gameTime}</div>
              <div className="stat-label">Restant</div>
            </div>
          </div>
          
          {/* Bottom Row: Bars & Challenges */}
          <div className="stat-item bars-item">
            <IonIcon icon={beerOutline} />
            <div className="stat-details">
              <div className="stat-value">{barsVisited}/{totalBars}</div>
              <div className="stat-label">Bars</div>
            </div>
          </div>

          <div className="stat-item challenges-item">
            <IonIcon icon={flagOutline} />
            <div className="stat-details">
              <div className="stat-value">{challengesCompleted}/{totalChallenges}</div>
              <div className="stat-label">Défis</div>
            </div>
          </div>

        </div>

        {/* Cagnotte Section (if present) - Spans full width below grid */}
        {cagnotteCurrentAmount !== undefined && cagnotteInitialAmount !== undefined && (
          <div className="cagnotte-wrapper-compact">
            <CagnotteSection 
              currentAmount={cagnotteCurrentAmount}
              initialAmount={cagnotteInitialAmount}
              isLoading={isCagnotteLoading}
              title="Cagnotte Équipe"
              className="embedded-cagnotte"
              onConsumption={onCagnotteConsumption}
            />
          </div>
        )}

      </IonCardContent>
      <IonRippleEffect />
    </IonCard>
  );
};

export default PlayerGameStatusCard; 