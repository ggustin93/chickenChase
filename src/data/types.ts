// Game related types for Chicken Chase app

export interface Game {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  status: 'active' | 'completed' | 'pending';
  maxTeams: number;
}

export interface Team {
  id: string;
  name: string;
  avatarUrl: string;
  score: number;
  members: TeamMember[];
  barsVisited: number;
  challengesCompleted: number;
  foundChicken: boolean;
}

export interface TeamMember {
  id: string;
  name: string;
  isLeader: boolean;
  avatarUrl?: string;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  points: number;
  active: boolean;
  completed: boolean;
  teams: string[];
  pendingValidation?: boolean;
}

export interface ChallengeCompletion {
  id: string;
  challengeId: string;
  teamId: string;
  timestamp: string;
  status: 'approved' | 'rejected' | 'pending';
  photoUrl?: string;
}

export interface Message {
  id: string;
  gameId: string;
  userId: string;
  sender: string;
  content: string;
  timestamp: string;
  isClue: boolean;
}

export interface Bar {
  id: string;
  name: string;
  address: string;
  description: string;
  photoUrl?: string;
  latitude: number;
  longitude: number;
}

export interface ChickenGameState {
  game: Game;
  teams: Team[];
  challenges: Challenge[];
  challengeCompletions: ChallengeCompletion[];
  messages: Message[];
  currentBar?: Bar;
  timeLeft: string;
  barOptions: Bar[];

  // Hypothetical Cagnotte values added
  initialCagnotte: number;
  currentCagnotte: number;
} 