/**
 * Team Service
 * Handles all team-related database operations
 */

import { supabase } from '../lib/supabase';
import { DatabaseService } from './base/DatabaseService';
import type { 
  DbTeam, 
  DbTeamInsert, 
  DbTeamUpdate,
  TeamWithRelations,
  ApiResponse 
} from '../data/database-types';

export class TeamService extends DatabaseService<'teams', DbTeam, DbTeamInsert, DbTeamUpdate> {
  protected tableName = 'teams' as const;

  /**
   * Get a team with all its related data
   */
  async findByIdWithRelations(teamId: string): Promise<ApiResponse<TeamWithRelations>> {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select(`
          *,
          game:games(*),
          players(*),
          challenge_submissions(*)
        `)
        .eq('id', teamId)
        .single();

      if (error) {
        return this.failure(this.formatError(error, 'findByIdWithRelations'));
      }

      return this.success(data as TeamWithRelations);
    } catch (error) {
      return this.failure(this.formatError(error as Error, 'findByIdWithRelations'));
    }
  }

  /**
   * Get teams for a specific game
   */
  async findByGameId(gameId: string): Promise<ApiResponse<DbTeam[]>> {
    return await this.findMany(
      { eq: { game_id: gameId } },
      { orderBy: { column: 'score', ascending: false } }
    );
  }

  /**
   * Get the chicken team for a game
   */
  async findChickenTeam(gameId: string): Promise<ApiResponse<DbTeam | null>> {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .eq('game_id', gameId)
        .eq('is_chicken_team', true)
        .limit(1);

      if (error) {
        return this.failure(this.formatError(error, 'findChickenTeam'));
      }

      return this.success(data.length > 0 ? data[0] as DbTeam : null);
    } catch (error) {
      return this.failure(this.formatError(error as Error, 'findChickenTeam'));
    }
  }

  /**
   * Get hunter teams for a game
   */
  async findHunterTeams(gameId: string): Promise<ApiResponse<DbTeam[]>> {
    return await this.findMany(
      { 
        eq: { game_id: gameId },
        neq: { is_chicken_team: true }
      },
      { orderBy: { column: 'score', ascending: false } }
    );
  }

  /**
   * Create a team and automatically join it
   */
  async createTeam(
    gameId: string,
    teamName: string,
    isChickenTeam: boolean = false
  ): Promise<ApiResponse<DbTeam>> {
    // Check if team name is unique in this game
    const existingTeam = await this.findMany({
      eq: { game_id: gameId, name: teamName }
    });

    if (existingTeam.success && existingTeam.data!.length > 0) {
      return this.failure('Team name already exists in this game');
    }

    const teamData: DbTeamInsert = {
      game_id: gameId,
      name: teamName,
      is_chicken_team: isChickenTeam,
      score: 0,
      bars_visited: 0,
      challenges_completed: 0,
      found_chicken: false
    };

    return await this.create(teamData);
  }

  /**
   * Set a team as the chicken team
   */
  async setAsChickenTeam(teamId: string): Promise<ApiResponse<DbTeam>> {
    // First, unset any existing chicken team in the same game
    const teamResult = await this.findById(teamId);
    if (!teamResult.success) {
      return teamResult;
    }

    const team = teamResult.data!;

    // Remove chicken team status from other teams in the same game
    await this.updateMany(
      { 
        eq: { game_id: team.game_id, is_chicken_team: true },
        neq: { id: teamId }
      },
      { is_chicken_team: false }
    );

    // Set this team as chicken team
    return await this.updateById(teamId, { is_chicken_team: true });
  }

  /**
   * Update team score
   */
  async updateScore(teamId: string, newScore: number): Promise<ApiResponse<DbTeam>> {
    return await this.updateById(teamId, { score: newScore });
  }

  /**
   * Add points to team score
   */
  async addPoints(teamId: string, points: number): Promise<ApiResponse<DbTeam>> {
    try {
      const teamResult = await this.findById(teamId);
      if (!teamResult.success) {
        return teamResult;
      }

      const currentScore = teamResult.data!.score;
      const newScore = currentScore + points;

      return await this.updateScore(teamId, newScore);
    } catch (error) {
      return this.failure(this.formatError(error as Error, 'addPoints'));
    }
  }

  /**
   * Increment bars visited count
   */
  async incrementBarsVisited(teamId: string): Promise<ApiResponse<DbTeam>> {
    try {
      const teamResult = await this.findById(teamId);
      if (!teamResult.success) {
        return teamResult;
      }

      const currentCount = teamResult.data!.bars_visited;
      return await this.updateById(teamId, { bars_visited: currentCount + 1 });
    } catch (error) {
      return this.failure(this.formatError(error as Error, 'incrementBarsVisited'));
    }
  }

  /**
   * Increment challenges completed count
   */
  async incrementChallengesCompleted(teamId: string): Promise<ApiResponse<DbTeam>> {
    try {
      const teamResult = await this.findById(teamId);
      if (!teamResult.success) {
        return teamResult;
      }

      const currentCount = teamResult.data!.challenges_completed;
      return await this.updateById(teamId, { challenges_completed: currentCount + 1 });
    } catch (error) {
      return this.failure(this.formatError(error as Error, 'incrementChallengesCompleted'));
    }
  }

  /**
   * Mark that team found the chicken
   */
  async markFoundChicken(teamId: string): Promise<ApiResponse<DbTeam>> {
    return await this.updateById(teamId, { found_chicken: true });
  }

  /**
   * Get team leaderboard for a game
   */
  async getLeaderboard(gameId: string): Promise<ApiResponse<DbTeam[]>> {
    return await this.findMany(
      { eq: { game_id: gameId } },
      { orderBy: { column: 'score', ascending: false } }
    );
  }

  /**
   * Get team statistics for a game
   */
  async getGameTeamStats(gameId: string): Promise<ApiResponse<{
    totalTeams: number;
    hunterTeams: number;
    chickenTeams: number;
    averageScore: number;
    topScore: number;
  }>> {
    try {
      const teamsResult = await this.findByGameId(gameId);
      if (!teamsResult.success) {
        return this.failure(teamsResult.error || 'Failed to get teams');
      }

      const teams = teamsResult.data!;
      const hunterTeams = teams.filter(t => !t.is_chicken_team);
      const chickenTeams = teams.filter(t => t.is_chicken_team);
      
      const totalScore = teams.reduce((sum, team) => sum + team.score, 0);
      const averageScore = teams.length > 0 ? totalScore / teams.length : 0;
      const topScore = teams.length > 0 ? Math.max(...teams.map(t => t.score)) : 0;

      return this.success({
        totalTeams: teams.length,
        hunterTeams: hunterTeams.length,
        chickenTeams: chickenTeams.length,
        averageScore: Math.round(averageScore * 100) / 100,
        topScore
      });
    } catch (error) {
      return this.failure(this.formatError(error as Error, 'getGameTeamStats'));
    }
  }

  /**
   * Join a team (update player's team_id)
   */
  async joinTeam(teamId: string, playerId: string): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase
        .from('players')
        .update({ team_id: teamId })
        .eq('id', playerId);

      if (error) {
        return this.failure(this.formatError(error, 'joinTeam'));
      }

      return this.success(true);
    } catch (error) {
      return this.failure(this.formatError(error as Error, 'joinTeam'));
    }
  }

  /**
   * Leave a team (set player's team_id to null)
   */
  async leaveTeam(playerId: string): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase
        .from('players')
        .update({ team_id: null })
        .eq('id', playerId);

      if (error) {
        return this.failure(this.formatError(error, 'leaveTeam'));
      }

      return this.success(true);
    } catch (error) {
      return this.failure(this.formatError(error as Error, 'leaveTeam'));
    }
  }

  /**
   * Check if team name is available in a game
   */
  async isTeamNameAvailable(gameId: string, teamName: string): Promise<ApiResponse<boolean>> {
    const result = await this.exists({
      eq: { game_id: gameId, name: teamName }
    });

    if (!result.success) {
      return result;
    }

    return this.success(!result.data!); // Available if it doesn't exist
  }

  /**
   * Get team by name in a specific game
   */
  async findByNameInGame(gameId: string, teamName: string): Promise<ApiResponse<DbTeam | null>> {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .eq('game_id', gameId)
        .eq('name', teamName)
        .limit(1);

      if (error) {
        return this.failure(this.formatError(error, 'findByNameInGame'));
      }

      return this.success(data.length > 0 ? data[0] as DbTeam : null);
    } catch (error) {
      return this.failure(this.formatError(error as Error, 'findByNameInGame'));
    }
  }
}

// Export singleton instance
export const teamService = new TeamService();