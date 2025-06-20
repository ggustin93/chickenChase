// Définir les types pour l'application

export type GameStatus = 'lobby' | 'in_progress' | 'chicken_hidden' | 'finished';

export interface Game {
  id: string;
  created_at: string;
  join_code: string;
  status: GameStatus;
  host_player_id: string;
  end_time?: string;
  // autres propriétés du jeu
}

export interface Player {
  id: string;
  created_at: string;
  game_id: string;
  nickname: string;
  team_id?: string;
  // autres propriétés du joueur
}

export interface Team {
  id: string;
  created_at: string;
  game_id: string;
  name: string;
  is_chicken_team: boolean;
  score?: number;
  // autres propriétés de l'équipe
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  points: number;
  type: 'photo' | 'unlock' | 'other';
  active: boolean;
  correctAnswer?: string;
  // autres propriétés du défi
}

export interface ChallengeCompletion {
  id: string;
  challengeId: string;
  teamId: string;
  playerId: string;
  status: 'pending' | 'approved' | 'rejected';
  submissionUrl?: string;
  // autres propriétés de la complétion de défi
}

export interface Message {
  id: string;
  content: string;
  sender: string;
  timestamp: string;
  isClue: boolean;
  // autres propriétés du message
}

export interface Bar {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  // autres propriétés du bar
} 