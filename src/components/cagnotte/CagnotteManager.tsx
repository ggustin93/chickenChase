/**
 * Cagnotte Management Component
 * Provides comprehensive cagnotte management with quick actions
 */

import React, { useState, useCallback } from 'react';
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonButton,
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea,
  IonIcon,
  IonChip,
  IonText,
  IonGrid,
  IonRow,
  IonCol,
  IonLoading,
  IonToast,
  IonAlert,
  IonSegment,
  IonSegmentButton,
  IonList,
  IonNote,
  IonBadge,
  useIonToast
} from '@ionic/react';
import {
  cashOutline,
  addOutline,
  removeOutline,
  refreshOutline,
  settingsOutline,
  timeOutline,
  trendingUpOutline,
  trendingDownOutline,
  checkmarkCircleOutline
} from 'ionicons/icons';
import { useCagnotteManagement } from '../../hooks/useCagnotteManagement';
import { QUICK_ACTIONS, PresetOperation } from '../../services/cagnotteService';
import './CagnotteManager.css';

interface CagnotteManagerProps {
  gameId: string;
  playerId?: string;
  showHistory?: boolean;
  allowCustomOperations?: boolean;
  compact?: boolean;
}

type TabType = 'manage' | 'history' | 'stats';

const CagnotteManager: React.FC<CagnotteManagerProps> = ({
  gameId,
  playerId,
  showHistory = true,
  allowCustomOperations = true,
  compact = false
}) => {
  const [present] = useIonToast();
  const [activeTab, setActiveTab] = useState<TabType>('manage');
  const [customAmount, setCustomAmount] = useState<string>('');
  const [customReason, setCustomReason] = useState<string>('');
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [showConfirmAlert, setShowConfirmAlert] = useState(false);
  const [pendingOperation, setPendingOperation] = useState<{
    type: 'preset' | 'custom';
    operation?: string;
    preset?: PresetOperation;
    amount?: number;
  } | null>(null);

  const {
    currentAmount,
    currentAmountFormatted,
    loading,
    error,
    history,
    stats,
    operationInProgress,
    netChangeFormatted,
    hasTransactions,
    canSubtract,
    executeQuickOperation,
    executeOperation,
    clearError,
    refreshData
  } = useCagnotteManagement({
    gameId,
    playerId,
    enableRealtime: true,
    historyLimit: 20
  });

  /**
   * Handle quick preset operations
   */
  const handleQuickOperation = useCallback(async (presetOperation: PresetOperation) => {
    setPendingOperation({ type: 'preset', preset: presetOperation });
    setShowConfirmAlert(true);
  }, []);

  /**
   * Handle custom operation
   */
  const handleCustomOperation = useCallback(async (operation: 'add' | 'subtract' | 'set' | 'reset') => {
    const amount = parseFloat(customAmount);
    
    if (isNaN(amount) || amount <= 0) {
      present({
        message: 'Veuillez entrer un montant valide',
        duration: 3000,
        color: 'danger'
      });
      return;
    }

    setPendingOperation({ 
      type: 'custom', 
      operation, 
      amount 
    });
    setShowConfirmAlert(true);
  }, [customAmount, present]);

  /**
   * Execute confirmed operation
   */
  const executeConfirmedOperation = useCallback(async () => {
    if (!pendingOperation) return;

    try {
      let result;
      
      if (pendingOperation.type === 'preset' && pendingOperation.preset) {
        result = await executeQuickOperation(pendingOperation.preset);
      } else if (pendingOperation.type === 'custom' && pendingOperation.operation && pendingOperation.amount) {
        result = await executeOperation(
          pendingOperation.operation as any,
          pendingOperation.amount,
          customReason || undefined
        );
      }

      if (result?.success) {
        present({
          message: result.message || 'Opération réussie',
          duration: 3000,
          color: 'success',
          icon: checkmarkCircleOutline
        });
        
        // Reset form
        setCustomAmount('');
        setCustomReason('');
        setShowCustomForm(false);
      }
    } catch (error) {
      present({
        message: error instanceof Error ? error.message : 'Erreur lors de l\'opération',
        duration: 5000,
        color: 'danger'
      });
    } finally {
      setPendingOperation(null);
      setShowConfirmAlert(false);
    }
  }, [pendingOperation, executeQuickOperation, executeOperation, customReason, present]);

  /**
   * Get operation confirmation message
   */
  const getConfirmationMessage = () => {
    if (!pendingOperation) return '';
    
    if (pendingOperation.type === 'preset') {
      const action = QUICK_ACTIONS.add.find(a => a.key === pendingOperation.preset) ||
                    QUICK_ACTIONS.subtract.find(a => a.key === pendingOperation.preset) ||
                    QUICK_ACTIONS.special.find(a => a.key === pendingOperation.preset);
      return `Confirmer l'opération: ${action?.label}`;
    } else {
      const { operation, amount } = pendingOperation;
      const operationText = {
        add: 'Ajouter',
        subtract: 'Retirer',
        set: 'Définir à',
        reset: 'Remettre à zéro'
      }[operation as string] || operation;
      
      return `Confirmer: ${operationText} ${amount}€`;
    }
  };

  /**
   * Render quick action buttons
   */
  const renderQuickActions = () => (
    <div className="cagnotte-quick-actions">
      <IonText color="medium" className="section-title">
        <h4>Actions rapides</h4>
      </IonText>
      
      {/* Add buttons */}
      <div className="action-group">
        <IonText color="success" className="action-label">Ajouter</IonText>
        <div className="action-buttons">
          {QUICK_ACTIONS.add.map((action) => (
            <IonButton
              key={action.key}
              size="small"
              color={action.color}
              fill="outline"
              onClick={() => handleQuickOperation(action.key as PresetOperation)}
              disabled={operationInProgress}
            >
              <IonIcon icon={addOutline} slot="start" />
              {action.label}
            </IonButton>
          ))}
        </div>
      </div>

      {/* Subtract buttons */}
      <div className="action-group">
        <IonText color="warning" className="action-label">Retirer</IonText>
        <div className="action-buttons">
          {QUICK_ACTIONS.subtract.map((action) => (
            <IonButton
              key={action.key}
              size="small"
              color={action.color}
              fill="outline"
              onClick={() => handleQuickOperation(action.key as PresetOperation)}
              disabled={operationInProgress || !canSubtract(action.amount)}
            >
              <IonIcon icon={removeOutline} slot="start" />
              {action.label}
            </IonButton>
          ))}
        </div>
      </div>

      {/* Special actions */}
      <div className="action-group">
        <IonText color="medium" className="action-label">Spécial</IonText>
        <div className="action-buttons">
          {QUICK_ACTIONS.special.map((action) => (
            <IonButton
              key={action.key}
              size="small"
              color={action.color}
              fill="outline"
              onClick={() => handleQuickOperation(action.key as PresetOperation)}
              disabled={operationInProgress}
            >
              <IonIcon icon={refreshOutline} slot="start" />
              {action.label}
            </IonButton>
          ))}
        </div>
      </div>
    </div>
  );

  /**
   * Render custom operation form
   */
  const renderCustomForm = () => (
    <div className="cagnotte-custom-form">
      <IonItem>
        <IonLabel position="stacked">Montant (€)</IonLabel>
        <IonInput
          type="number"
          step="0.01"
          value={customAmount}
          onIonInput={(e) => setCustomAmount(e.detail.value!)}
          placeholder="0.00"
        />
      </IonItem>
      
      <IonItem>
        <IonLabel position="stacked">Raison (optionnel)</IonLabel>
        <IonTextarea
          value={customReason}
          onIonInput={(e) => setCustomReason(e.detail.value!)}
          placeholder="Description de l'opération..."
          rows={2}
        />
      </IonItem>
      
      <div className="custom-action-buttons">
        <IonButton
          color="success"
          fill="outline"
          onClick={() => handleCustomOperation('add')}
          disabled={!customAmount || operationInProgress}
        >
          <IonIcon icon={addOutline} slot="start" />
          Ajouter
        </IonButton>
        
        <IonButton
          color="warning"
          fill="outline"
          onClick={() => handleCustomOperation('subtract')}
          disabled={!customAmount || operationInProgress}
        >
          <IonIcon icon={removeOutline} slot="start" />
          Retirer
        </IonButton>
        
        <IonButton
          color="medium"
          fill="outline"
          onClick={() => handleCustomOperation('set')}
          disabled={!customAmount || operationInProgress}
        >
          <IonIcon icon={settingsOutline} slot="start" />
          Définir
        </IonButton>
      </div>
    </div>
  );

  /**
   * Render transaction history
   */
  const renderHistory = () => (
    <IonList className="cagnotte-history">
      {history.map((transaction) => (
        <IonItem key={transaction.id}>
          <IonIcon
            icon={transaction.transaction_type === 'add' ? trendingUpOutline : 
                  transaction.transaction_type === 'subtract' ? trendingDownOutline : 
                  refreshOutline}
            color={transaction.transaction_type === 'add' ? 'success' : 
                   transaction.transaction_type === 'subtract' ? 'warning' : 'medium'}
            slot="start"
          />
          <IonLabel>
            <h3>
              {transaction.transaction_type === 'add' ? '+' : 
               transaction.transaction_type === 'subtract' ? '-' : ''}
              {(transaction.amount_cents / 100).toFixed(2)}€
            </h3>
            <p>{transaction.reason || 'Opération sur la cagnotte'}</p>
            <IonNote color="medium">
              {new Date(transaction.created_at).toLocaleString()}
              {transaction.player_nickname && ` • ${transaction.player_nickname}`}
            </IonNote>
          </IonLabel>
          <IonBadge 
            color={transaction.transaction_type === 'add' ? 'success' : 
                   transaction.transaction_type === 'subtract' ? 'warning' : 'medium'}
            slot="end"
          >
            {(transaction.new_amount_cents / 100).toFixed(2)}€
          </IonBadge>
        </IonItem>
      ))}
      
      {!hasTransactions && (
        <IonItem>
          <IonLabel color="medium" className="ion-text-center">
            Aucune transaction pour le moment
          </IonLabel>
        </IonItem>
      )}
    </IonList>
  );

  /**
   * Render statistics
   */
  const renderStats = () => (
    <div className="cagnotte-stats">
      {stats && (
        <IonGrid>
          <IonRow>
            <IonCol size="6">
              <IonCard>
                <IonCardContent className="ion-text-center">
                  <IonText color="primary">
                    <h2>{(stats.current_amount / 100).toFixed(2)}€</h2>
                  </IonText>
                  <p>Montant actuel</p>
                </IonCardContent>
              </IonCard>
            </IonCol>
            <IonCol size="6">
              <IonCard>
                <IonCardContent className="ion-text-center">
                  <IonText color="medium">
                    <h2>{(stats.initial_amount / 100).toFixed(2)}€</h2>
                  </IonText>
                  <p>Montant initial</p>
                </IonCardContent>
              </IonCard>
            </IonCol>
          </IonRow>
          <IonRow>
            <IonCol size="4">
              <div className="stat-item">
                <IonText color="success">
                  <h3>+{(stats.operations.total_added / 100).toFixed(2)}€</h3>
                </IonText>
                <p>{stats.operations.additions} ajouts</p>
              </div>
            </IonCol>
            <IonCol size="4">
              <div className="stat-item">
                <IonText color="warning">
                  <h3>-{(stats.operations.total_subtracted / 100).toFixed(2)}€</h3>
                </IonText>
                <p>{stats.operations.subtractions} retraits</p>
              </div>
            </IonCol>
            <IonCol size="4">
              <div className="stat-item">
                <IonText color={stats.net_change >= 0 ? 'success' : 'danger'}>
                  <h3>{netChangeFormatted}</h3>
                </IonText>
                <p>Variation nette</p>
              </div>
            </IonCol>
          </IonRow>
        </IonGrid>
      )}
    </div>
  );

  if (loading && !currentAmount) {
    return <IonLoading isOpen={true} message="Chargement de la cagnotte..." />;
  }

  return (
    <div className={`cagnotte-manager ${compact ? 'compact' : ''}`}>
      {/* Header with current amount */}
      <IonCard className="cagnotte-header">
        <IonCardHeader>
          <IonCardTitle className="ion-text-center">
            <IonIcon icon={cashOutline} color="primary" />
            <span className="cagnotte-amount">{currentAmountFormatted}</span>
            <IonButton
              fill="clear"
              size="small"
              onClick={refreshData}
              disabled={loading}
            >
              <IonIcon icon={refreshOutline} />
            </IonButton>
          </IonCardTitle>
        </IonCardHeader>
      </IonCard>

      {/* Tab navigation */}
      {!compact && (
        <IonSegment
          value={activeTab}
          onIonChange={(e) => setActiveTab(e.detail.value as TabType)}
        >
          <IonSegmentButton value="manage">
            <IonLabel>Gérer</IonLabel>
          </IonSegmentButton>
          {showHistory && (
            <IonSegmentButton value="history">
              <IonLabel>Historique</IonLabel>
            </IonSegmentButton>
          )}
          <IonSegmentButton value="stats">
            <IonLabel>Stats</IonLabel>
          </IonSegmentButton>
        </IonSegment>
      )}

      {/* Content based on active tab */}
      <div className="cagnotte-content">
        {(activeTab === 'manage' || compact) && (
          <>
            {renderQuickActions()}
            
            {allowCustomOperations && (
              <div className="custom-operations">
                <IonButton
                  fill="outline"
                  expand="block"
                  onClick={() => setShowCustomForm(!showCustomForm)}
                  disabled={operationInProgress}
                >
                  <IonIcon icon={settingsOutline} slot="start" />
                  Opération personnalisée
                </IonButton>
                
                {showCustomForm && renderCustomForm()}
              </div>
            )}
          </>
        )}

        {activeTab === 'history' && showHistory && renderHistory()}
        {activeTab === 'stats' && renderStats()}
      </div>

      {/* Loading overlay */}
      <IonLoading isOpen={operationInProgress} message="Opération en cours..." />

      {/* Error toast */}
      <IonToast
        isOpen={!!error}
        message={error || ''}
        duration={5000}
        color="danger"
        onDidDismiss={clearError}
      />

      {/* Confirmation alert */}
      <IonAlert
        isOpen={showConfirmAlert}
        header="Confirmer l'opération"
        message={getConfirmationMessage()}
        buttons={[
          {
            text: 'Annuler',
            role: 'cancel',
            handler: () => {
              setPendingOperation(null);
              setShowConfirmAlert(false);
            }
          },
          {
            text: 'Confirmer',
            handler: executeConfirmedOperation
          }
        ]}
      />
    </div>
  );
};

export default CagnotteManager;