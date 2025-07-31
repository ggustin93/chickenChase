import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

interface CagnotteState {
  current: number; // en centimes
  initial: number; // en centimes  
  loading: boolean;
  error: string | null;
  lastUpdate?: string;
}

interface CagnotteTransaction {
  id: string;
  game_id: string;
  player_id?: string;
  transaction_type: 'add' | 'subtract' | 'set' | 'reset';
  amount_cents: number;
  previous_amount_cents: number;
  new_amount_cents: number;
  reason?: string;
  metadata?: any;
  created_at: string;
}

interface UseRealtimeCagnotteResult extends CagnotteState {
  updateCagnotte: (operation: 'add' | 'subtract' | 'set', amount: number, reason?: string) => Promise<any>;
  resetCagnotte: () => Promise<any>;
  transactions: CagnotteTransaction[];
  quickOperation: (operation: string) => Promise<any>;
}

/**
 * Hook pour gérer la cagnotte en temps réel avec Supabase
 * S'assure que tous les joueurs ET le poulet voient les mises à jour instantanément
 */
export const useRealtimeCagnotte = (gameId?: string): UseRealtimeCagnotteResult => {
  const [state, setState] = useState<CagnotteState>({
    current: 0,
    initial: 0,
    loading: false,
    error: null
  });
  
  const [transactions, setTransactions] = useState<CagnotteTransaction[]>([]);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  /**
   * Charger l'état initial de la cagnotte
   */
  const loadInitialCagnotte = useCallback(async () => {
    if (!gameId) return;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Charger les données du jeu
      const { data: gameData, error: gameError } = await supabase
        .from('games')
        .select('cagnotte_initial, cagnotte_current')
        .eq('id', gameId)
        .single();

      if (gameError) throw gameError;

      // Charger les transactions récentes
      const { data: transactionData, error: transactionError } = await supabase
        .from('cagnotte_transactions')
        .select('*')
        .eq('game_id', gameId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (transactionError) {
        console.warn('Erreur lors du chargement des transactions:', transactionError);
      }

      setState({
        current: gameData.cagnotte_current || 0,
        initial: gameData.cagnotte_initial || 0,
        loading: false,
        error: null,
        lastUpdate: new Date().toISOString()
      });

      setTransactions(transactionData || []);

    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Erreur lors du chargement de la cagnotte'
      }));
    }
  }, [gameId]);

  /**
   * Mettre à jour la cagnotte (pour le poulet)
   */
  const updateCagnotte = useCallback(async (operation: 'add' | 'subtract' | 'set', amount: number, reason?: string) => {
    if (!gameId) return;

    try {
      // Utiliser la fonction RPC pour mettre à jour la cagnotte de manière atomique
      const { data, error } = await supabase.rpc('update_cagnotte', {
        p_game_id: gameId,
        p_operation: operation,
        p_amount_cents: amount,
        p_player_id: null,
        p_reason: reason || `${operation} cagnotte`
      });

      if (error) throw error;

      // La mise à jour sera propagée via Realtime
      console.log('✅ Cagnotte mise à jour:', operation, amount / 100, '€', data);

      return data;

    } catch (error) {
      console.error('❌ Erreur mise à jour cagnotte:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Erreur lors de la mise à jour'
      }));
      throw error;
    }
  }, [gameId]);

  /**
   * Remettre la cagnotte à sa valeur initiale
   */
  const resetCagnotte = useCallback(async () => {
    if (!gameId) return;

    try {
      const { data, error } = await supabase.rpc('update_cagnotte', {
        p_game_id: gameId,
        p_operation: 'reset',
        p_amount_cents: 0,
        p_player_id: null,
        p_reason: 'Reset cagnotte'
      });

      if (error) throw error;

      console.log('✅ Cagnotte remise à sa valeur initiale:', data);
      return data;

    } catch (error) {
      console.error('❌ Erreur reset cagnotte:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Erreur lors du reset'
      }));
      throw error;
    }
  }, [gameId]);

  /**
   * Operations rapides prédéfinies (pour l'équipe poulet)
   */
  const quickOperation = useCallback(async (operation: string) => {
    if (!gameId) {
      console.log('🚫 quickOperation: No gameId provided');
      return;
    }

    console.log('🚀 quickOperation: Starting operation:', operation, 'for game:', gameId);

    try {
      const { data, error } = await supabase.rpc('quick_cagnotte_operation', {
        p_game_id: gameId,
        p_preset_operation: operation,
        p_player_id: null
      });

      if (error) throw error;

      console.log('✅ quickOperation: Success:', operation, data);
      console.log('💰 Expected: Real-time update should follow shortly...');
      return data;

    } catch (error) {
      console.error('❌ quickOperation: Error:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Erreur lors de l\'opération rapide'
      }));
      throw error;
    }
  }, [gameId]);

  /**
   * Configurer les souscriptions Realtime
   */
  useEffect(() => {
    if (!gameId) {
      console.log('🚫 useRealtimeCagnotte: No gameId provided');
      return;
    }

    console.log('🚀 useRealtimeCagnotte: Setting up for game:', gameId);

    // Charger l'état initial
    loadInitialCagnotte();

    // Créer le canal Realtime pour ce jeu
    const channelName = `game-cagnotte-${gameId}`;
    console.log('📡 Creating channel:', channelName);
    const gameChannel = supabase.channel(channelName);

    // 1️⃣ Écouter les changements sur la table games (cagnotte_current)
    gameChannel.on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'games',
        filter: `id=eq.${gameId}`
      },
      (payload) => {
        console.log('🔄 Game cagnotte update received:', payload);
        console.log('🔄 Previous state cagnotte_current:', payload.old?.cagnotte_current);
        console.log('🔄 New state cagnotte_current:', payload.new?.cagnotte_current);
        
        if (payload.new) {
          setState(prev => {
            const newState = {
              ...prev,
              current: payload.new.cagnotte_current || 0,
              initial: payload.new.cagnotte_initial || 0,
              lastUpdate: new Date().toISOString()
            };
            console.log('🔄 Updating state from', prev.current, 'to', newState.current);
            return newState;
          });
        }
      }
    );

    // 2️⃣ Écouter les nouvelles transactions
    gameChannel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'cagnotte_transactions',
        filter: `game_id=eq.${gameId}`
      },
      (payload) => {
        console.log('💰 New cagnotte transaction:', payload);
        
        if (payload.new) {
          setTransactions(prev => [payload.new as CagnotteTransaction, ...prev.slice(0, 9)]);
        }
      }
    );

    // S'abonner au canal
    gameChannel.subscribe((status) => {
      console.log(`📡 Cagnotte Realtime status: ${status}`);
      if (status === 'SUBSCRIBED') {
        console.log('✅ Successfully subscribed to cagnotte updates');
      } else if (status === 'CLOSED') {
        console.log('❌ Cagnotte subscription closed');
      } else if (status === 'CHANNEL_ERROR') {
        console.log('🚨 Channel error in cagnotte subscription');
      }
    });

    setChannel(gameChannel);

    // Cleanup
    return () => {
      console.log('🧹 Cleaning up cagnotte realtime subscription for channel:', channelName);
      gameChannel.unsubscribe();
    };
  }, [gameId, loadInitialCagnotte]);

  return {
    ...state,
    updateCagnotte,
    resetCagnotte,
    quickOperation,
    transactions
  };
};