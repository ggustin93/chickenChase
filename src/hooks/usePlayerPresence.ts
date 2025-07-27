/**
 * Hook for managing player presence in the lobby with Ionic toast notifications
 */

import { useEffect, useRef, useState } from 'react';
import { useIonToast } from '@ionic/react';
import { PlayerPresenceService, playerPresenceService } from '../services/PlayerPresenceService';
import { supabase } from '../lib/supabase';

interface UsePlayerPresenceOptions {
  gameId: string | null;
  playerId: string | null;
  playerNickname?: string;
  showToasts?: boolean;
}

interface PlayerPresenceInfo {
  playerId: string;
  nickname: string;
  lastSeen: string;
  isActive: boolean;
}

export const usePlayerPresence = ({
  gameId,
  playerId,
  playerNickname,
  showToasts = true
}: UsePlayerPresenceOptions) => {
  const [present] = useIonToast();
  const [activePlayers, setActivePlayers] = useState<string[]>([]);
  const [playerInfo, setPlayerInfo] = useState<Map<string, PlayerPresenceInfo>>(new Map());
  const presenceChannelRef = useRef<any>(null);
  const isTrackingRef = useRef(false);

  // Start presence tracking when player joins
  useEffect(() => {
    if (!gameId || !playerId || isTrackingRef.current) return;

    const startTracking = async () => {
      try {
        await playerPresenceService.startTracking(playerId, gameId);
        isTrackingRef.current = true;
        console.log('✅ Player presence tracking started');
      } catch (error) {
        console.error('❌ Failed to start presence tracking:', error);
      }
    };

    startTracking();

    return () => {
      if (isTrackingRef.current) {
        playerPresenceService.stopTracking();
        isTrackingRef.current = false;
      }
    };
  }, [gameId, playerId]);

  // Subscribe to presence changes and show toasts
  useEffect(() => {
    if (!gameId) return;

    // Load initial active players
    const loadActivePlayers = async () => {
      const active = await PlayerPresenceService.getActivePlayers(gameId);
      setActivePlayers(active);
      
      // Load player info for active players
      if (active.length > 0) {
        const { data: players } = await supabase
          .from('players')
          .select('id, nickname')
          .in('id', active);
        
        if (players) {
          const newPlayerInfo = new Map();
          players.forEach(player => {
            newPlayerInfo.set(player.id, {
              playerId: player.id,
              nickname: player.nickname,
              lastSeen: new Date().toISOString(),
              isActive: true
            });
          });
          setPlayerInfo(newPlayerInfo);
        }
      }
    };

    loadActivePlayers();

    // Subscribe to presence changes
    const handlePlayerJoined = async (joinedPlayerId: string) => {
      if (joinedPlayerId === playerId) return; // Don't show toast for self
      
      // Get player info
      const { data: playerData } = await supabase
        .from('players')
        .select('nickname')
        .eq('id', joinedPlayerId)
        .single();
      
      const nickname = playerData?.nickname || 'Un joueur';
      
      setActivePlayers(prev => {
        if (!prev.includes(joinedPlayerId)) {
          return [...prev, joinedPlayerId];
        }
        return prev;
      });
      
      setPlayerInfo(prev => {
        const newMap = new Map(prev);
        newMap.set(joinedPlayerId, {
          playerId: joinedPlayerId,
          nickname,
          lastSeen: new Date().toISOString(),
          isActive: true
        });
        return newMap;
      });

      if (showToasts) {
        present({
          message: `🟢 ${nickname} a rejoint le lobby`,
          duration: 3000,
          position: 'top',
          color: 'success',
          icon: 'person-add',
          cssClass: 'player-joined-toast'
        });
      }
    };

    const handlePlayerLeft = async (leftPlayerId: string) => {
      if (leftPlayerId === playerId) return; // Don't show toast for self
      
      // Get player info from our cache or database
      let nickname = playerInfo.get(leftPlayerId)?.nickname;
      
      if (!nickname) {
        const { data: playerData } = await supabase
          .from('players')
          .select('nickname')
          .eq('id', leftPlayerId)
          .single();
        nickname = playerData?.nickname || 'Un joueur';
      }
      
      setActivePlayers(prev => prev.filter(id => id !== leftPlayerId));
      
      setPlayerInfo(prev => {
        const newMap = new Map(prev);
        const existingInfo = newMap.get(leftPlayerId);
        if (existingInfo) {
          newMap.set(leftPlayerId, {
            ...existingInfo,
            isActive: false,
            lastSeen: new Date().toISOString()
          });
        }
        return newMap;
      });

      if (showToasts) {
        present({
          message: `🔴 ${nickname} a quitté le lobby`,
          duration: 3000,
          position: 'top',
          color: 'warning',
          icon: 'person-remove',
          cssClass: 'player-left-toast'
        });
      }
    };

    presenceChannelRef.current = PlayerPresenceService.subscribeToPresenceChanges(
      gameId,
      handlePlayerJoined,
      handlePlayerLeft
    );

    return () => {
      if (presenceChannelRef.current) {
        supabase.removeChannel(presenceChannelRef.current);
      }
    };
  }, [gameId, playerId, playerNickname, showToasts, present, playerInfo]);

  // Also listen to regular player table changes for additional reliability
  useEffect(() => {
    if (!gameId) return;

    const playersChannel = supabase
      .channel(`lobby-players-${gameId}`)
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'players',
        filter: `game_id=eq.${gameId}`
      }, async (payload) => {
        const deletedPlayer = payload.old as any;
        
        if (deletedPlayer.id !== playerId && showToasts) {
          present({
            message: `👋 ${deletedPlayer.nickname || 'Un joueur'} a quitté définitivement`,
            duration: 3000,
            position: 'top',
            color: 'medium',
            icon: 'exit',
            cssClass: 'player-disconnected-toast'
          });
        }
        
        // Remove from our tracking
        setActivePlayers(prev => prev.filter(id => id !== deletedPlayer.id));
        setPlayerInfo(prev => {
          const newMap = new Map(prev);
          newMap.delete(deletedPlayer.id);
          return newMap;
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(playersChannel);
    };
  }, [gameId, playerId, showToasts, present]);

  // Cleanup inactive players periodically
  useEffect(() => {
    if (!gameId) return;

    const cleanupInterval = setInterval(async () => {
      try {
        const { data, error } = await supabase
          .rpc('cleanup_inactive_players', { 
            game_uuid: gameId, 
            timeout_seconds: 90 
          });
        
        if (error) {
          console.error('Error cleaning up inactive players:', error);
        } else if (data > 0) {
          console.log(`🧹 Cleaned up ${data} inactive players`);
        }
      } catch (error) {
        console.error('Error in cleanup interval:', error);
      }
    }, 60000); // Run every minute

    return () => clearInterval(cleanupInterval);
  }, [gameId]);

  return {
    activePlayers,
    playerInfo: Object.fromEntries(playerInfo),
    isTrackingPresence: isTrackingRef.current
  };
};