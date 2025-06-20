export interface Player {
  id: string;
  nickname: string;
  game_id: string;
  team_id?: string;
}

export interface Team {
  id: string;
  name: string;
  game_id: string;
  is_chicken_team: boolean;
}

export interface Game {
  id: string;
  join_code: string;
  host_player_id: string;
  status: 'lobby' | 'in_progress' | 'finished';
} 