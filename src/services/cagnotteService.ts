/**
 * Cagnotte Management Service
 * Handles all cagnotte operations with backend integration
 */

import { supabase } from '../lib/supabase';
import { logError, createAppError } from '../utils/errorUtils';

// Types for cagnotte operations
export interface CagnotteTransaction {
  id: string;
  transaction_type: 'add' | 'subtract' | 'set' | 'reset';
  amount_cents: number;
  previous_amount_cents: number;
  new_amount_cents: number;
  reason?: string;
  created_at: string;
  player_nickname?: string;
}

export interface CagnotteStats {
  current_amount: number;
  initial_amount: number;
  net_change: number;
  total_transactions: number;
  operations: {
    additions: number;
    subtractions: number;
    total_added: number;
    total_subtracted: number;
  };
  game_created_at: string;
}

export interface CagnotteOperationResult {
  success: boolean;
  operation?: string;
  previous_amount?: number;
  new_amount?: number;
  transaction_id?: string;
  message?: string;
  error?: string;
}

// Preset operation types
export type PresetOperation = 
  | 'spend_5' | 'spend_10' | 'spend_15' | 'spend_20' | 'spend_30' | 'spend_40' | 'spend_50'
  | 'add_5' | 'add_10' | 'add_20' 
  | 'subtract_5' | 'subtract_10' | 'subtract_20' 
  | 'reset';

// Quick action configurations
export const QUICK_ACTIONS = {
  add: [
    { key: 'add_5', label: '+5€', amount: 5, color: 'success' },
    { key: 'add_10', label: '+10€', amount: 10, color: 'success' },
    { key: 'add_20', label: '+20€', amount: 20, color: 'success' },
  ],
  subtract: [
    { key: 'subtract_5', label: '-5€', amount: 5, color: 'warning' },
    { key: 'subtract_10', label: '-10€', amount: 10, color: 'warning' },
    { key: 'subtract_20', label: '-20€', amount: 20, color: 'warning' },
  ],
  special: [
    { key: 'reset', label: 'Reset', amount: 0, color: 'medium' },
  ]
} as const;

export class CagnotteService {
  /**
   * Update cagnotte with custom amount and operation
   */
  static async updateCagnotte(
    gameId: string,
    operation: 'add' | 'subtract' | 'set' | 'reset',
    amountEuros: number,
    playerId?: string,
    reason?: string
  ): Promise<CagnotteOperationResult> {
    try {
      const amountCents = Math.round(amountEuros * 100);
      
      const { data, error } = await supabase.rpc('update_cagnotte', {
        p_game_id: gameId,
        p_operation: operation,
        p_amount_cents: amountCents,
        p_player_id: playerId || null,
        p_reason: reason || null
      });

      if (error) {
        logError(error, { gameId, operation, amountEuros, playerId });
        throw createAppError(
          `Failed to update cagnotte: ${error.message}`,
          'CAGNOTTE_UPDATE_ERROR',
          'high',
          { gameId, operation, amountEuros }
        );
      }

      return data as CagnotteOperationResult;
    } catch (error) {
      logError(error, { gameId, operation, amountEuros });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Execute quick preset operations
   */
  static async quickOperation(
    gameId: string,
    presetOperation: PresetOperation,
    playerId?: string
  ): Promise<CagnotteOperationResult> {
    try {
      const { data, error } = await supabase.rpc('quick_cagnotte_operation', {
        p_game_id: gameId,
        p_preset_operation: presetOperation,
        p_player_id: playerId || null
      });

      if (error) {
        logError(error, { gameId, presetOperation, playerId });
        throw createAppError(
          `Failed to execute quick operation: ${error.message}`,
          'CAGNOTTE_QUICK_OP_ERROR',
          'medium',
          { gameId, presetOperation }
        );
      }

      return data as CagnotteOperationResult;
    } catch (error) {
      logError(error, { gameId, presetOperation });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get cagnotte transaction history
   */
  static async getTransactionHistory(
    gameId: string,
    limit: number = 20
  ): Promise<CagnotteTransaction[]> {
    try {
      const { data, error } = await supabase.rpc('get_cagnotte_history', {
        p_game_id: gameId,
        p_limit: limit
      });

      if (error) {
        logError(error, { gameId, limit });
        throw createAppError(
          `Failed to fetch transaction history: ${error.message}`,
          'CAGNOTTE_HISTORY_ERROR',
          'medium',
          { gameId }
        );
      }

      return data || [];
    } catch (error) {
      logError(error, { gameId, limit });
      return [];
    }
  }

  /**
   * Get cagnotte statistics
   */
  static async getCagnotteStats(gameId: string): Promise<CagnotteStats | null> {
    try {
      const { data, error } = await supabase.rpc('get_cagnotte_stats', {
        p_game_id: gameId
      });

      if (error) {
        logError(error, { gameId });
        throw createAppError(
          `Failed to fetch cagnotte stats: ${error.message}`,
          'CAGNOTTE_STATS_ERROR',
          'medium',
          { gameId }
        );
      }

      return data as CagnotteStats;
    } catch (error) {
      logError(error, { gameId });
      return null;
    }
  }

  /**
   * Format amount from cents to euros string
   */
  static formatAmount(amountCents: number): string {
    return (amountCents / 100).toFixed(2) + '€';
  }

  /**
   * Convert euros to cents
   */
  static eurosToCents(euros: number): number {
    return Math.round(euros * 100);
  }

  /**
   * Convert cents to euros
   */
  static centsToEuros(cents: number): number {
    return cents / 100;
  }

  /**
   * Validate cagnotte operation
   */
  static validateOperation(
    operation: string,
    amount: number,
    currentAmount: number
  ): { valid: boolean; error?: string } {
    if (amount < 0) {
      return { valid: false, error: 'Amount cannot be negative' };
    }

    if (operation === 'subtract' && amount > currentAmount) {
      return { 
        valid: false, 
        error: `Cannot subtract ${this.formatAmount(this.eurosToCents(amount))} from ${this.formatAmount(currentAmount)}` 
      };
    }

    if (operation === 'set' && amount < 0) {
      return { valid: false, error: 'Cannot set negative amount' };
    }

    return { valid: true };
  }

  /**
   * Subscribe to real-time cagnotte updates
   */
  static subscribeToUpdates(
    gameId: string,
    onUpdate: (payload: any) => void
  ) {
    return supabase
      .channel(`cagnotte-updates-${gameId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'game_events',
        filter: `game_id=eq.${gameId}`,
      }, (payload) => {
        if (payload.new.event_type === 'cagnotte_updated') {
          onUpdate(payload.new.event_data);
        }
      })
      .subscribe();
  }
}