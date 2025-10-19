/**
 * useChickenGameState Hook Unit Tests
 * 
 * Tests the core chicken game state management hook
 * Following SOLID principles: Single Responsibility, Testability
 * KISS approach: Focus on critical functionality
 * DRY: Reusable test utilities
 */

import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import useChickenGameState from '../../src/hooks/useChickenGameState';
import { gameService } from '../../src/services/GameService';
import { challengeService } from '../../src/services/ChallengeService';
import { messageService } from '../../src/services/MessageService';

// Mock dependencies following Dependency Inversion Principle
vi.mock('../../src/services/GameService');
vi.mock('../../src/services/ChallengeService');
vi.mock('../../src/services/MessageService');
vi.mock('../../src/lib/supabase', () => ({
  supabase: {
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(() => ({ status: 'SUBSCRIBED' })),
    })),
    removeChannel: vi.fn(),
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
    })),
  },
}));

// Mock useGameBars hook
vi.mock('../../src/hooks/useGameBars', () => ({
  useGameBars: vi.fn(() => ({
    bars: [],
    loading: false,
    error: null,
  })),
}));

// Test utilities following DRY principle
const createMockGameData = (overrides: any = {}) => ({
  id: 'test-game-id',
  join_code: 'TEST123',
  status: 'lobby',
  host_player_id: 'host-player-id',
  chicken_team_id: null,
  cagnotte_initial: 1000,
  cagnotte_current: 1000,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  chicken_hidden_at: null,
  max_teams: 8,
  game_duration: 120,
  started_at: null,
  all_teams: [],
  all_players: [],
  bars: [],
  ...overrides,
});

const createMockChallenge = (overrides: any = {}) => ({
  id: 'challenge-1',
  title: 'Test Challenge',
  description: 'Test description',
  points: 100,
  type: 'photo',
  correct_answer: null,
  ...overrides,
});

describe('useChickenGameState Hook', () => {
  const mockGameService = gameService as any;
  const mockChallengeService = challengeService as any;
  const mockMessageService = messageService as any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mock responses
    mockGameService.findByIdWithRelations = vi.fn().mockResolvedValue({
      success: true,
      data: createMockGameData(),
    });
    
    mockChallengeService.findMany = vi.fn().mockResolvedValue({
      success: true,
      data: [createMockChallenge()],
    });
    
    mockMessageService.findByGameId = vi.fn().mockResolvedValue({
      success: true,
      data: [],
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial State (MVP Core)', () => {
    it('should initialize with correct default state', async () => {
      const { result } = renderHook(() => useChickenGameState('test-game-id'));
      
      // Initially loading
      expect(result.current.isLoading).toBe(true);
      expect(result.current.error).toBe(null);
      
      // Wait for data to load
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      
      expect(result.current.gameState).toBeDefined();
      expect(result.current.gameState.game.id).toBe('test-game-id');
      expect(result.current.gameState.isChickenHidden).toBe(false);
    });

    it('should handle empty gameId gracefully', async () => {
      const { result } = renderHook(() => useChickenGameState(undefined));
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      
      expect(mockGameService.findByIdWithRelations).not.toHaveBeenCalled();
    });
  });

  describe('Game State Transformation', () => {
    it('should correctly transform database game data to UI state', async () => {
      const mockData = createMockGameData({
        status: 'chicken_hidden',
        chicken_hidden_at: new Date().toISOString(),
        all_teams: [
          {
            id: 'team-1',
            name: 'Team A',
            score: 50,
            bars_visited: 2,
            challenges_completed: 1,
            found_chicken: false,
            is_chicken_team: false,
          },
        ],
      });
      
      mockGameService.findByIdWithRelations.mockResolvedValue({
        success: true,
        data: mockData,
      });
      
      const { result } = renderHook(() => useChickenGameState('test-game-id'));
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      
      const { gameState } = result.current;
      
      expect(gameState.game.status).toBe('chicken_hidden');
      expect(gameState.isChickenHidden).toBe(true);
      expect(gameState.teams).toHaveLength(1);
      expect(gameState.teams[0].name).toBe('Team A');
      expect(gameState.teams[0].score).toBe(50);
    });
  });

  describe('Hide Chicken Functionality (Critical)', () => {
    it('should hide chicken and update state correctly', async () => {
      mockGameService.hideChicken = vi.fn().mockResolvedValue({
        success: true,
        data: createMockGameData({ status: 'chicken_hidden' }),
      });
      
      const { result } = renderHook(() => useChickenGameState('test-game-id'));
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      
      await act(async () => {
        await result.current.hideChicken();
      });
      
      expect(mockGameService.hideChicken).toHaveBeenCalledWith('test-game-id');
      expect(result.current.gameState.isChickenHidden).toBe(true);
      expect(result.current.gameState.game.status).toBe('chicken_hidden');
    });

    it('should handle hide chicken failure gracefully', async () => {
      mockGameService.hideChicken = vi.fn().mockResolvedValue({
        success: false,
        error: 'Failed to hide chicken',
      });
      
      const { result } = renderHook(() => useChickenGameState('test-game-id'));
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      
      await act(async () => {
        await result.current.hideChicken();
      });
      
      // Should still call the service but handle error gracefully
      expect(mockGameService.hideChicken).toHaveBeenCalledWith('test-game-id');
      // State should have fallback behavior
      expect(result.current.gameState.isChickenHidden).toBe(true);
    });
  });

  describe('Challenge Management', () => {
    it('should handle challenge validation', async () => {
      const { result } = renderHook(() => useChickenGameState('test-game-id'));
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      
      // Mock challenge validation with database calls
      const mockSubmission = {
        id: 'submission-1',
        challenge: { title: 'Test Challenge' },
        team: { name: 'Test Team' },
      };
      
      // Mock supabase calls for challenge validation
      const { supabase } = await import('../../src/lib/supabase');
      (supabase.from as Mock).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockSubmission,
          error: null,
        }),
        update: vi.fn().mockReturnThis(),
      });
      
      await act(async () => {
        await result.current.handleChallengeValidation('submission-1', true);
      });
      
      // Should have added a validation message
      expect(result.current.gameState.messages.length).toBeGreaterThan(0);
    });
  });

  describe('Timer Management', () => {
    it('should manage game timer when chicken is hidden', async () => {
      vi.useFakeTimers();
      
      const mockData = createMockGameData({
        status: 'chicken_hidden',
        chicken_hidden_at: new Date().toISOString(),
      });
      
      mockGameService.findByIdWithRelations.mockResolvedValue({
        success: true,
        data: mockData,
      });
      
      const { result } = renderHook(() => useChickenGameState('test-game-id'));
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      
      const initialTimeLeft = result.current.gameState.timeLeft;
      
      // Advance timer by 1 second
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      
      // Time should have decreased (this tests the timer logic)
      expect(result.current.gameState.timeLeft).not.toBe(initialTimeLeft);
      
      vi.useRealTimers();
    });
  });

  describe('Error Handling (SOLID: Resilience)', () => {
    it('should handle service failures gracefully', async () => {
      mockGameService.findByIdWithRelations.mockResolvedValue({
        success: false,
        error: 'Database connection failed',
      });
      
      const { result } = renderHook(() => useChickenGameState('test-game-id'));
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      
      expect(result.current.error).toBe('Database connection failed');
      expect(result.current.gameState).toBeDefined(); // Should still have initial state
    });

    it('should handle network timeouts', async () => {
      mockGameService.findByIdWithRelations.mockRejectedValue(
        new Error('Network timeout')
      );
      
      const { result } = renderHook(() => useChickenGameState('test-game-id'));
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      
      expect(result.current.error).toBe('Failed to load game data');
    });
  });

  describe('Message Management', () => {
    it('should send clues and update state', async () => {
      const { result } = renderHook(() => useChickenGameState('test-game-id'));
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      
      const initialMessageCount = result.current.gameState.messages.length;
      
      act(() => {
        result.current.sendClue('Test clue message');
      });
      
      expect(result.current.gameState.messages.length).toBe(initialMessageCount + 1);
      expect(result.current.gameState.messages[initialMessageCount].content).toBe('Test clue message');
      expect(result.current.gameState.messages[initialMessageCount].isClue).toBe(true);
    });
  });
});