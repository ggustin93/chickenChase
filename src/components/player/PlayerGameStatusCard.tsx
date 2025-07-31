import React from 'react';
import { IonCard, IonCardContent, IonIcon, IonRippleEffect, IonSpinner, IonBadge } from '@ionic/react';
import { trophyOutline, timeOutline, beerOutline, flagOutline, cashOutline, wifiOutline } from 'ionicons/icons';
import { useRealtimeCagnotte } from '../../hooks/useRealtimeCagnotte';
import './PlayerGameStatusCard.css';

interface PlayerGameStatusCardProps {
  gameId: string; // Add gameId to use real-time cagnotte
  score: number;
  gameTime: string;
  barsVisited: number;
  totalBars: number;
  challengesCompleted: number;
  totalChallenges: number;
  onCagnotteClick?: () => void;
}

const PlayerGameStatusCard: React.FC<PlayerGameStatusCardProps> = ({
  gameId,
  score,
  gameTime,
  barsVisited,
  totalBars,
  challengesCompleted,
  totalChallenges,
  onCagnotteClick
}) => {
  // Use real-time cagnotte hook
  const { current: cagnotteCurrentAmount, initial: cagnotteInitialAmount, loading: isCagnotteLoading, error: cagnotteError, lastUpdate } = useRealtimeCagnotte(gameId);
  
  const isTimeCritical = gameTime.includes('0:') || gameTime.includes('00:');
  const formatAmount = (cents: number) => `${(cents / 100).toFixed(2)}€`;
  
  return (
    <IonCard className="player-status-card ion-activatable compact-status-card">
      <IonCardContent className="player-status-content compact-content">
        
        <div className="status-grid">
          {/* Top Row: Score & Cagnotte */}
          <div className="stat-item score-item">
            <IonIcon icon={trophyOutline} />
            <div className="stat-details">
              <div className="stat-value">{score} pts</div>
              <div className="stat-label">Score</div>
            </div>
          </div>
          
          {/* Real-time Cagnotte */}
          <div className="stat-item cagnotte-item clickable" onClick={onCagnotteClick}>
            <IonIcon icon={cashOutline} />
            <div className="stat-details">
              <div className="stat-value">
                {isCagnotteLoading && cagnotteCurrentAmount === 0 ? (
                  <IonSpinner />
                ) : cagnotteError ? (
                  <span className="error-text">Erreur</span>
                ) : (
                  formatAmount(cagnotteCurrentAmount)
                )}
              </div>
              <div className="stat-label flex items-center gap-1">
                Cagnotte
                {lastUpdate && (
                  <IonBadge color="success" className="real-time-indicator">
                    <IonIcon icon={wifiOutline} />
                  </IonBadge>
                )}
              </div>
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

      </IonCardContent>
      <IonRippleEffect />
    </IonCard>
  );
};

export default PlayerGameStatusCard; 