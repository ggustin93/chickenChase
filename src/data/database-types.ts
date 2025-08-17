/**
 * Database Types - Generated from Supabase Schema
 * This file contains TypeScript types that exactly match the database schema
 */

// ===== CORE ENUMS =====
export type GameStatus = 'lobby' | 'in_progress' | 'chicken_hidden' | 'finished' | 'cancelled';
export type ChallengeType = 'photo' | 'unlock' | 'location' | 'quiz';
export type SubmissionStatus = 'pending' | 'approved' | 'rejected';
export type EventType = 'game_started' | 'chicken_hidden' | 'bar_visited' | 'challenge_completed' | 'team_joined' | 'game_finished';

// ===== DATABASE TABLES =====

export interface DbGame {
  id: string;
  created_at: string;
  updated_at: string | null;
  join_code: string;
  status: GameStatus;
  host_player_id: string | null;
  chicken_team_id: string | null;
  cagnotte_initial: number; // stored in cents
  cagnotte_current: number; // stored in cents
  chicken_hidden_at: string | null;
  max_teams: number | null;
  game_duration: number | null; // minutes, default 120
  started_at: string | null;
}

export interface DbTeam {
  id: string;
  game_id: string;
  name: string;
  score: number;
  bars_visited: number;
  challenges_completed: number;
  found_chicken: boolean;
  is_chicken_team: boolean | null;
}

export interface DbPlayer {
  id: string;
  user_id: string | null;
  game_id: string;
  team_id: string | null;
  nickname: string;
}

export interface DbChallenge {
  id: string;
  title: string;
  description: string | null;
  points: number;
  type: string;
  correct_answer: string | null;
}

export interface DbChallengeSubmission {
  id: string;
  challenge_id: string;
  team_id: string;
  game_id: string;
  status: SubmissionStatus;
  photo_url: string | null;
  submitted_at: string;
}

export interface DbMessage {
  id: number; // bigint auto-increment
  created_at: string;
  game_id: string;
  player_id: string | null;
  content: string;
  is_system_message: boolean;
}

export interface DbGameEvent {
  id: string;
  game_id: string;
  event_type: string;
  event_data: Record<string, any>; // jsonb
  created_at: string;
}

export interface DbGameStatusHistory {
  id: string;
  game_id: string;
  old_status: string | null;
  new_status: string;
  changed_at: string;
  changed_by: string | null;
  metadata: Record<string, any> | null; // jsonb
}

export interface DbGameBar {
  id: string;
  game_id: string;
  name: string;
  address: string;
  description: string | null;
  latitude: number;
  longitude: number;
  photo_url: string | null;
  google_place_id: string | null;
  rating: number | null; // numeric(2,1)
  visited: boolean | null;
  visited_by_team_id: string | null;
  visited_at: string | null;
  created_at: string;
}

// ===== INSERT TYPES (for creating new records) =====

export interface DbGameInsert {
  id?: string;
  created_at?: string;
  updated_at?: string;
  join_code: string;
  status?: GameStatus;
  host_player_id?: string;
  chicken_team_id?: string;
  cagnotte_initial: number;
  cagnotte_current: number;
  chicken_hidden_at?: string;
  max_teams?: number;
  game_duration?: number;
  started_at?: string;
}

export interface DbTeamInsert {
  id?: string;
  game_id: string;
  name: string;
  score?: number;
  bars_visited?: number;
  challenges_completed?: number;
  found_chicken?: boolean;
  is_chicken_team?: boolean;
}

export interface DbPlayerInsert {
  id?: string;
  user_id?: string;
  game_id: string;
  team_id?: string;
  nickname: string;
}

export interface DbChallengeInsert {
  id?: string;
  title: string;
  description?: string;
  points: number;
  type: string;
  correct_answer?: string;
}

export interface DbChallengeSubmissionInsert {
  id?: string;
  challenge_id: string;
  team_id: string;
  game_id: string;
  status?: SubmissionStatus;
  photo_url?: string;
  submitted_at?: string;
}

export interface DbMessageInsert {
  game_id: string;
  player_id?: string;
  content: string;
  is_system_message?: boolean;
}

export interface DbGameEventInsert {
  id?: string;
  game_id: string;
  event_type: string;
  event_data: Record<string, any>;
  created_at?: string;
}

export interface DbGameBarInsert {
  id?: string;
  game_id: string;
  name: string;
  address: string;
  description?: string;
  latitude: number;
  longitude: number;
  photo_url?: string;
  google_place_id?: string;
  rating?: number;
  visited?: boolean;
  visited_by_team_id?: string;
  visited_at?: string;
  created_at?: string;
}

// ===== UPDATE TYPES (for updating existing records) =====

export interface DbGameUpdate {
  updated_at?: string;
  join_code?: string;
  status?: GameStatus;
  host_player_id?: string;
  chicken_team_id?: string;
  cagnotte_initial?: number;
  cagnotte_current?: number;
  chicken_hidden_at?: string;
  max_teams?: number;
  game_duration?: number;
  started_at?: string;
}

export interface DbTeamUpdate {
  name?: string;
  score?: number;
  bars_visited?: number;
  challenges_completed?: number;
  found_chicken?: boolean;
  is_chicken_team?: boolean;
}

export interface DbPlayerUpdate {
  user_id?: string;
  team_id?: string;
  nickname?: string;
}

export interface DbChallengeUpdate {
  title?: string;
  description?: string;
  points?: number;
  type?: string;
  correct_answer?: string;
}

export interface DbChallengeSubmissionUpdate {
  status?: SubmissionStatus;
  photo_url?: string;
}

export interface DbGameBarUpdate {
  name?: string;
  address?: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  photo_url?: string;
  google_place_id?: string;
  rating?: number;
  visited?: boolean;
  visited_by_team_id?: string;
  visited_at?: string;
}

// ===== QUERY RESULT TYPES (with joins) =====

export interface GameWithRelations extends DbGame {
  host_player?: DbPlayer;
  chicken_team?: DbTeam;
  all_teams?: DbTeam[];
  all_players?: DbPlayer[];
  bars?: DbGameBar[];
}

export interface TeamWithRelations extends DbTeam {
  game?: DbGame;
  players?: DbPlayer[];
  challenge_submissions?: DbChallengeSubmission[];
}

export interface PlayerWithRelations extends DbPlayer {
  game?: DbGame;
  team?: DbTeam;
  messages?: DbMessage[];
}

export interface ChallengeWithSubmissions extends DbChallenge {
  submissions?: DbChallengeSubmission[];
}

// ===== API RESPONSE TYPES =====

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ===== UTILITY TYPES =====

export type DatabaseTable = 
  | 'games'
  | 'teams' 
  | 'players'
  | 'challenges'
  | 'challenge_submissions'
  | 'messages'
  | 'game_events'
  | 'game_status_history'
  | 'game_bars';

export type DbRecord<T extends DatabaseTable> = 
  T extends 'games' ? DbGame :
  T extends 'teams' ? DbTeam :
  T extends 'players' ? DbPlayer :
  T extends 'challenges' ? DbChallenge :
  T extends 'challenge_submissions' ? DbChallengeSubmission :
  T extends 'messages' ? DbMessage :
  T extends 'game_events' ? DbGameEvent :
  T extends 'game_status_history' ? DbGameStatusHistory :
  T extends 'game_bars' ? DbGameBar :
  never;

export type DbInsert<T extends DatabaseTable> = 
  T extends 'games' ? DbGameInsert :
  T extends 'teams' ? DbTeamInsert :
  T extends 'players' ? DbPlayerInsert :
  T extends 'challenges' ? DbChallengeInsert :
  T extends 'challenge_submissions' ? DbChallengeSubmissionInsert :
  T extends 'messages' ? DbMessageInsert :
  T extends 'game_events' ? DbGameEventInsert :
  T extends 'game_bars' ? DbGameBarInsert :
  never;

export type DbUpdate<T extends DatabaseTable> = 
  T extends 'games' ? DbGameUpdate :
  T extends 'teams' ? DbTeamUpdate :
  T extends 'players' ? DbPlayerUpdate :
  T extends 'challenges' ? DbChallengeUpdate :
  T extends 'challenge_submissions' ? DbChallengeSubmissionUpdate :
  T extends 'game_bars' ? DbGameBarUpdate :
  never;