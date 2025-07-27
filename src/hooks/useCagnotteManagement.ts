/**
 * Custom hook for cagnotte management with real-time updates
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { CagnotteService, CagnotteTransaction, CagnotteStats, PresetOperation } from '../services/cagnotteService';
import { logError } from '../utils/errorUtils';

interface UseCagnotteManagementOptions {
  gameId: string;
  playerId?: string;
  enableRealtime?: boolean;
  historyLimit?: number;
}

interface CagnotteState {
  currentAmount: number;
  loading: boolean;
  error: string | null;
  history: CagnotteTransaction[];
  stats: CagnotteStats | null;
  operationInProgress: boolean;
}

export const useCagnotteManagement = ({
  gameId,
  playerId,
  enableRealtime = true,
  historyLimit = 20
}: UseCagnotteManagementOptions) => {
  
  const [state, setState] = useState<CagnotteState>({
    currentAmount: 0,
    loading: true,
    error: null,
    history: [],
    stats: null,
    operationInProgress: false
  });

  // Memoized dependencies to prevent unnecessary re-renders
  const dependencies = useMemo(() => ({ 
    gameId, 
    playerId, 
    enableRealtime, 
    historyLimit 
  }), [gameId, playerId, enableRealtime, historyLimit]);

  /**
   * Load cagnotte data and history
   */
  const loadCagnotteData = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Load stats and history in parallel
      const [stats, history] = await Promise.all([
        CagnotteService.getCagnotteStats(gameId),
        CagnotteService.getTransactionHistory(gameId, historyLimit)
      ]);

      setState(prev => ({
        ...prev,
        currentAmount: stats?.current_amount || 0,
        stats,
        history,
        loading: false
      }));
    } catch (error) {
      logError(error, { gameId, historyLimit });
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to load cagnotte data',
        loading: false
      }));
    }
  }, [gameId, historyLimit]);

  /**
   * Execute cagnotte operation
   */
  const executeOperation = useCallback(async (
    operation: 'add' | 'subtract' | 'set' | 'reset',
    amountEuros: number,
    reason?: string
  ) => {
    setState(prev => ({ ...prev, operationInProgress: true, error: null }));

    try {
      // Validate operation first
      const validation = CagnotteService.validateOperation(
        operation,
        amountEuros,
        state.currentAmount
      );

      if (!validation.valid) {
        throw new Error(validation.error);
      }

      const result = await CagnotteService.updateCagnotte(
        gameId,
        operation,
        amountEuros,
        playerId,
        reason
      );

      if (!result.success) {
        throw new Error(result.error || 'Operation failed');
      }

      // Refresh data after successful operation
      await loadCagnotteData();
      
      return result;
    } catch (error) {
      logError(error, { gameId, operation, amountEuros, playerId });
      const errorMessage = error instanceof Error ? error.message : 'Operation failed';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    } finally {
      setState(prev => ({ ...prev, operationInProgress: false }));
    }
  }, [gameId, playerId, state.currentAmount, loadCagnotteData]);

  /**
   * Execute quick preset operation
   */
  const executeQuickOperation = useCallback(async (presetOperation: PresetOperation) => {
    setState(prev => ({ ...prev, operationInProgress: true, error: null }));

    try {
      const result = await CagnotteService.quickOperation(
        gameId,
        presetOperation,
        playerId
      );

      if (!result.success) {
        throw new Error(result.error || 'Quick operation failed');
      }

      // Refresh data after successful operation
      await loadCagnotteData();
      
      return result;
    } catch (error) {
      logError(error, { gameId, presetOperation, playerId });
      const errorMessage = error instanceof Error ? error.message : 'Quick operation failed';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    } finally {
      setState(prev => ({ ...prev, operationInProgress: false }));
    }
  }, [gameId, playerId, loadCagnotteData]);

  /**
   * Add amount to cagnotte
   */
  const addAmount = useCallback(async (euros: number, reason?: string) => {
    return executeOperation('add', euros, reason);
  }, [executeOperation]);

  /**
   * Subtract amount from cagnotte
   */
  const subtractAmount = useCallback(async (euros: number, reason?: string) => {
    return executeOperation('subtract', euros, reason);
  }, [executeOperation]);

  /**
   * Set cagnotte to specific amount
   */
  const setAmount = useCallback(async (euros: number, reason?: string) => {
    return executeOperation('set', euros, reason);
  }, [executeOperation]);

  /**
   * Reset cagnotte to initial amount
   */
  const resetCagnotte = useCallback(async (reason?: string) => {
    return executeOperation('reset', 0, reason);
  }, [executeOperation]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  /**
   * Format amount for display
   */
  const formatAmount = useCallback((amountCents: number) => {
    return CagnotteService.formatAmount(amountCents);
  }, []);

  // Load initial data
  useEffect(() => {
    if (gameId) {
      loadCagnotteData();
    }
  }, [loadCagnotteData, gameId]);

  // Set up real-time updates
  useEffect(() => {
    if (!enableRealtime || !gameId) return;

    const subscription = CagnotteService.subscribeToUpdates(gameId, (updateData) => {
      console.log('Cagnotte real-time update received:', updateData);
      
      setState(prev => ({
        ...prev,
        currentAmount: updateData.new_amount,
        // Add new transaction to history
        history: [
          {
            id: updateData.transaction_id,
            transaction_type: updateData.operation,
            amount_cents: updateData.amount_cents,
            previous_amount_cents: updateData.previous_amount,
            new_amount_cents: updateData.new_amount,
            reason: updateData.reason,
            created_at: new Date().toISOString(),
          },
          ...prev.history.slice(0, historyLimit - 1)
        ]
      }));
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [enableRealtime, gameId, historyLimit]);

  // Memoized computed values
  const computedValues = useMemo(() => ({
    currentAmountFormatted: formatAmount(state.currentAmount),
    hasTransactions: state.history.length > 0,
    canSubtract: (amount: number) => state.currentAmount >= CagnotteService.eurosToCents(amount),
    netChange: state.stats ? state.stats.current_amount - state.stats.initial_amount : 0,
    netChangeFormatted: state.stats ? formatAmount(state.stats.current_amount - state.stats.initial_amount) : '0.00€'
  }), [state.currentAmount, state.history.length, state.stats, formatAmount]);

  return {
    // State
    ...state,
    ...computedValues,
    
    // Actions
    executeOperation,
    executeQuickOperation,
    addAmount,
    subtractAmount,
    setAmount,
    resetCagnotte,
    refreshData: loadCagnotteData,
    clearError,
    formatAmount,
    
    // Utilities
    validateOperation: CagnotteService.validateOperation,
    eurosToCents: CagnotteService.eurosToCents,
    centsToEuros: CagnotteService.centsToEuros
  };
};