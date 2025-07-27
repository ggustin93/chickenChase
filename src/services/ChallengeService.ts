/**
 * Challenge Service
 * Handles all challenge-related database operations
 */

import { supabase } from '../lib/supabase';
import { DatabaseService } from './base/DatabaseService';
import type { 
  DbChallenge, 
  DbChallengeInsert, 
  DbChallengeUpdate,
  DbChallengeSubmission,
  DbChallengeSubmissionInsert,
  DbChallengeSubmissionUpdate,
  ChallengeWithSubmissions,
  ApiResponse,
  SubmissionStatus 
} from '../data/database-types';

export class ChallengeService extends DatabaseService<'challenges', DbChallenge, DbChallengeInsert, DbChallengeUpdate> {
  protected tableName = 'challenges' as const;

  /**
   * Get a challenge with all its submissions
   */
  async findByIdWithSubmissions(challengeId: string): Promise<ApiResponse<ChallengeWithSubmissions>> {
    try {
      const { data, error } = await supabase
        .from('challenges')
        .select(`
          *,
          submissions:challenge_submissions(*)
        `)
        .eq('id', challengeId)
        .single();

      if (error) {
        return this.failure(this.formatError(error, 'findByIdWithSubmissions'));
      }

      return this.success(data as ChallengeWithSubmissions);
    } catch (error) {
      return this.failure(this.formatError(error as Error, 'findByIdWithSubmissions'));
    }
  }

  /**
   * Get challenges by type
   */
  async findByType(type: string): Promise<ApiResponse<DbChallenge[]>> {
    return await this.findMany({ eq: { type } });
  }

  /**
   * Get challenges with minimum points
   */
  async findByMinPoints(minPoints: number): Promise<ApiResponse<DbChallenge[]>> {
    return await this.findMany({ gte: { points: minPoints } });
  }

  /**
   * Create multiple challenges with rich mockup data
   */
  async createDefaultChallenges(): Promise<ApiResponse<DbChallenge[]>> {
    const defaultChallenges: DbChallengeInsert[] = [
      // Social and Fun Challenges
      {
        title: 'Trinquons entre inconnus!',
        description: 'Offrez un verre à un parfait inconnu dans le bar et immortalisez ce moment de générosité avec un selfie "tchin-tchin".',
        points: 50,
        type: 'photo'
      },
      {
        title: 'Meilleure Imitation d\'Animal',
        description: 'Faites votre meilleure imitation d\'un animal de la ferme devant le personnel du bar. Filmez la réaction!',
        points: 30,
        type: 'photo'
      },
      {
        title: 'Danse de la Poule',
        description: 'Dansez "la danse de la poule" pendant 30 secondes dans le bar. Tout l\'équipe doit participer!',
        points: 35,
        type: 'photo'
      },
      {
        title: 'Cocktail Original',
        description: 'Demandez au barman de vous créer un cocktail avec au moins 3 ingrédients insolites et prenez une photo du résultat.',
        points: 40,
        type: 'photo'
      },
      {
        title: 'Karaoké Improvisé',
        description: 'Chantez une chanson en français (même si c\'est mal!) devant les clients du bar.',
        points: 45,
        type: 'photo'
      },
      {
        title: 'Histoire du Lieu',
        description: 'Demandez au personnel l\'histoire du bar/restaurant et racontez-nous en 1 minute en vidéo.',
        points: 40,
        type: 'photo'
      },

      // Tourist/Brussels Challenges
      {
        title: 'Faire un "à fond" de groupe devant le Manneken Pis',
        description: 'Faire un "à fond" de groupe devant le Manneken Pis',
        points: 100,
        type: 'photo'
      },
      {
        title: 'Bière Belge Authentique',
        description: 'Commandez une bière belge traditionnelle et expliquez pourquoi vous l\'avez choisie en vidéo.',
        points: 25,
        type: 'photo'
      },
      {
        title: 'Selfie avec un Belge',
        description: 'Prenez un selfie avec un local belge et demandez-lui de dire "Salut les poulets!" en français.',
        points: 35,
        type: 'photo'
      },
      {
        title: 'Spécialité Locale',
        description: 'Commandez et goûtez une spécialité culinaire belge (frites, gaufres, moules, etc.) et donnez votre avis en vidéo.',
        points: 30,
        type: 'photo'
      },
      {
        title: 'Guide Touristique',
        description: 'Faites un mini-guide touristique de 2 minutes sur le quartier où vous vous trouvez.',
        points: 50,
        type: 'photo'
      },
      {
        title: 'Monument Mystère',
        description: 'Trouvez un monument, statue ou plaque historique dans un rayon de 200m et expliquez son histoire.',
        points: 60,
        type: 'photo'
      },
      {
        title: 'Accent Belge',
        description: 'Imitez l\'accent belge pendant une conversation de 2 minutes avec un local.',
        points: 45,
        type: 'photo'
      },
      {
        title: 'Flemish ou Français?',
        description: 'Trouvez quelqu\'un qui parle flamand et demandez-lui d\'enseigner un mot à votre équipe.',
        points: 40,
        type: 'photo'
      },
      {
        title: 'Architecture Bruxelloise',
        description: 'Photographiez 3 styles architecturaux différents dans la même rue et expliquez les différences.',
        points: 55,
        type: 'photo'
      },

      // Creative/Artistic Challenges
      {
        title: 'Street Art',
        description: 'Trouvez une œuvre de street art ou graffiti et recréez la pose/l\'expression avec votre équipe.',
        points: 40,
        type: 'photo'
      },
      {
        title: 'Mode Belge',
        description: 'Chaque membre de l\'équipe doit porter quelque chose de typiquement belge (même improvisé) pour la photo.',
        points: 35,
        type: 'photo'
      },

      // Riddle/Unlock Challenges
      {
        title: 'Qu\'est-ce qui est petit et marron?',
        description: 'Une énigme pour les plus forts.',
        points: 350,
        type: 'unlock',
        correct_answer: 'un marron'
      },
      {
        title: 'Où se trouve la plus ancienne statue de Bruxelles?',
        description: 'Indice: Elle est très... exposée.',
        points: 200,
        type: 'unlock',
        correct_answer: 'Manneken Pis'
      },
      {
        title: 'Quelle rue abrite le plus célèbre petit bonhomme de Bruxelles?',
        description: 'Vous y trouverez celui qui fait pipi depuis des siècles.',
        points: 150,
        type: 'unlock',
        correct_answer: 'Rue de l\'Étuve'
      }
    ];

    return await this.createMany(defaultChallenges);
  }

  /**
   * Get challenges ordered by points
   */
  async findOrderedByPoints(ascending: boolean = true): Promise<ApiResponse<DbChallenge[]>> {
    return await this.findMany(
      {},
      { orderBy: { column: 'points', ascending } }
    );
  }
}

export class ChallengeSubmissionService extends DatabaseService<'challenge_submissions', DbChallengeSubmission, DbChallengeSubmissionInsert, DbChallengeSubmissionUpdate> {
  protected tableName = 'challenge_submissions' as const;

  /**
   * Submit a challenge for a team
   */
  async submitChallenge(
    challengeId: string,
    teamId: string,
    gameId: string,
    photoUrl?: string,
    textAnswer?: string
  ): Promise<ApiResponse<DbChallengeSubmission>> {
    const submissionData: DbChallengeSubmissionInsert = {
      challenge_id: challengeId,
      team_id: teamId,
      game_id: gameId,
      status: 'pending',
      photo_url: photoUrl,
      submitted_at: new Date().toISOString()
    };

    return await this.create(submissionData);
  }

  /**
   * Approve a submission
   */
  async approveSubmission(submissionId: string): Promise<ApiResponse<DbChallengeSubmission>> {
    return await this.updateById(submissionId, { status: 'approved' });
  }

  /**
   * Reject a submission
   */
  async rejectSubmission(submissionId: string): Promise<ApiResponse<DbChallengeSubmission>> {
    return await this.updateById(submissionId, { status: 'rejected' });
  }

  /**
   * Get submissions by status
   */
  async findByStatus(status: SubmissionStatus): Promise<ApiResponse<DbChallengeSubmission[]>> {
    return await this.findMany({ eq: { status } });
  }

  /**
   * Get submissions for a specific game
   */
  async findByGameId(gameId: string): Promise<ApiResponse<DbChallengeSubmission[]>> {
    return await this.findMany(
      { eq: { game_id: gameId } },
      { orderBy: { column: 'submitted_at', ascending: false } }
    );
  }

  /**
   * Get submissions for a specific team
   */
  async findByTeamId(teamId: string): Promise<ApiResponse<DbChallengeSubmission[]>> {
    return await this.findMany(
      { eq: { team_id: teamId } },
      { orderBy: { column: 'submitted_at', ascending: false } }
    );
  }

  /**
   * Get submissions for a specific challenge
   */
  async findByChallengeId(challengeId: string): Promise<ApiResponse<DbChallengeSubmission[]>> {
    return await this.findMany(
      { eq: { challenge_id: challengeId } },
      { orderBy: { column: 'submitted_at', ascending: false } }
    );
  }

  /**
   * Get team's submission for a specific challenge
   */
  async findTeamSubmission(
    teamId: string, 
    challengeId: string
  ): Promise<ApiResponse<DbChallengeSubmission | null>> {
    try {
      const { data, error } = await supabase
        .from('challenge_submissions')
        .select('*')
        .eq('team_id', teamId)
        .eq('challenge_id', challengeId)
        .order('submitted_at', { ascending: false })
        .limit(1);

      if (error) {
        return this.failure(this.formatError(error, 'findTeamSubmission'));
      }

      return this.success(data.length > 0 ? data[0] as DbChallengeSubmission : null);
    } catch (error) {
      return this.failure(this.formatError(error as Error, 'findTeamSubmission'));
    }
  }

  /**
   * Get pending submissions for admin review
   */
  async findPendingSubmissions(): Promise<ApiResponse<DbChallengeSubmission[]>> {
    return await this.findByStatus('pending');
  }

  /**
   * Get submission statistics for a game
   */
  async getGameSubmissionStats(gameId: string): Promise<ApiResponse<{
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  }>> {
    try {
      const [totalResult, pendingResult, approvedResult, rejectedResult] = await Promise.all([
        this.count({ eq: { game_id: gameId } }),
        this.count({ eq: { game_id: gameId, status: 'pending' } }),
        this.count({ eq: { game_id: gameId, status: 'approved' } }),
        this.count({ eq: { game_id: gameId, status: 'rejected' } })
      ]);

      if (!totalResult.success || !pendingResult.success || !approvedResult.success || !rejectedResult.success) {
        return this.failure('Failed to get submission statistics');
      }

      return this.success({
        total: totalResult.data!,
        pending: pendingResult.data!,
        approved: approvedResult.data!,
        rejected: rejectedResult.data!
      });
    } catch (error) {
      return this.failure(this.formatError(error as Error, 'getGameSubmissionStats'));
    }
  }

  /**
   * Auto-validate unlock-type challenges
   */
  async validateUnlockChallenge(
    challengeId: string,
    teamId: string,
    gameId: string,
    submittedAnswer: string
  ): Promise<ApiResponse<DbChallengeSubmission>> {
    try {
      // First get the challenge to check the correct answer
      const { data: challenge, error: challengeError } = await supabase
        .from('challenges')
        .select('correct_answer, type')
        .eq('id', challengeId)
        .single();

      if (challengeError) {
        return this.failure(this.formatError(challengeError, 'validateUnlockChallenge'));
      }

      if (challenge.type !== 'unlock') {
        return this.failure('Challenge is not an unlock type');
      }

      // Check if answer is correct
      const isCorrect = challenge.correct_answer?.trim().toLowerCase() === submittedAnswer.trim().toLowerCase();
      const status: SubmissionStatus = isCorrect ? 'approved' : 'rejected';

      // Create the submission with auto-validation
      const submissionData: DbChallengeSubmissionInsert = {
        challenge_id: challengeId,
        team_id: teamId,
        game_id: gameId,
        status: status,
        submitted_at: new Date().toISOString()
      };

      return await this.create(submissionData);
    } catch (error) {
      return this.failure(this.formatError(error as Error, 'validateUnlockChallenge'));
    }
  }
}

// Export singleton instances
export const challengeService = new ChallengeService();
export const challengeSubmissionService = new ChallengeSubmissionService();