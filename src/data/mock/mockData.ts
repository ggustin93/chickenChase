import { 
  ChickenGameState, 
  Game, 
  Bar, 
  Team, 
  TeamMember, 
  Challenge, 
  ChallengeCompletion,
  Message
} from '../types';

// Données simulées pour le jeu
const mockGame: Game = {
  id: 'game-001',
  name: 'La Course du Poulet - Édition Pigalle',
  startTime: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
  endTime: new Date(Date.now() + 135 * 60 * 1000).toISOString(),
  status: 'active',
  maxTeams: 8
};

// Données simulées pour les bars
const mockBars: Bar[] = [
  {
    id: 'bar-001',
    name: 'Le Coq Sportif',
    address: '23 Rue des Martyrs, 75009 Paris',
    description: 'Un bar sportif avec une bonne sélection de bières.',
    photoUrl: 'https://source.unsplash.com/random/800x600/?pub&sig=1',
    latitude: 48.8789,
    longitude: 2.3395
  },
  {
    id: 'bar-002',
    name: 'Chez Poule & Coq',
    address: '18 Rue Condorcet, 75009 Paris',
    description: 'Un bistrot traditionnel français avec des cocktails signature.',
    photoUrl: 'https://source.unsplash.com/random/800x600/?pub&sig=2',
    latitude: 48.8806,
    longitude: 2.3445
  },
  {
    id: 'bar-003',
    name: 'La Plume Dorée',
    address: '42 Boulevard de Clichy, 75018 Paris',
    description: 'Bar chic avec musique live et cocktails artisanaux.',
    photoUrl: 'https://source.unsplash.com/random/800x600/?pub&sig=3',
    latitude: 48.8824,
    longitude: 2.3381
  },
  {
    id: 'bar-004',
    name: 'Le Poulet Ivre',
    address: '8 Rue Pierre Fontaine, 75009 Paris',
    description: 'Bar à thème avec décoration inspirée de la volaille.',
    photoUrl: 'https://source.unsplash.com/random/800x600/?pub&sig=4',
    latitude: 48.8810,
    longitude: 2.3350
  },
  {
    id: 'bar-005',
    name: 'Les Œufs d\'Or',
    address: '15 Rue Frochot, 75009 Paris',
    description: 'Petit bar intime avec une ambiance conviviale.',
    photoUrl: 'https://source.unsplash.com/random/800x600/?pub&sig=5',
    latitude: 48.8805,
    longitude: 2.3370
  },
];

// Données simulées pour les membres d'équipe
const mockTeamMembers1: TeamMember[] = [
  {
    id: 'user-001',
    name: 'alex93',
    isLeader: true,
    avatarUrl: 'https://source.unsplash.com/random/100x100/?portrait&sig=1'
  },
  {
    id: 'user-002',
    name: 'sophie22',
    isLeader: false,
    avatarUrl: 'https://source.unsplash.com/random/100x100/?portrait&sig=2'
  }
];

const mockTeamMembers2: TeamMember[] = [
  {
    id: 'user-003',
    name: 'thomas75',
    isLeader: true,
    avatarUrl: 'https://source.unsplash.com/random/100x100/?portrait&sig=3'
  },
  {
    id: 'user-004',
    name: 'julie_p',
    isLeader: false,
    avatarUrl: 'https://source.unsplash.com/random/100x100/?portrait&sig=4'
  },
  {
    id: 'user-005',
    name: 'marc44',
    isLeader: false,
    avatarUrl: 'https://source.unsplash.com/random/100x100/?portrait&sig=5'
  }
];

const mockTeamMembers3: TeamMember[] = [
  {
    id: 'user-006',
    name: 'emma_b',
    isLeader: true,
    avatarUrl: 'https://source.unsplash.com/random/100x100/?portrait&sig=6'
  },
  {
    id: 'user-007',
    name: 'lucas77',
    isLeader: false,
    avatarUrl: 'https://source.unsplash.com/random/100x100/?portrait&sig=7'
  }
];

const mockTeamMembers4: TeamMember[] = [
  {
    id: 'user-008',
    name: 'pauline23',
    isLeader: true,
    avatarUrl: 'https://source.unsplash.com/random/100x100/?portrait&sig=8'
  },
  {
    id: 'user-009',
    name: 'david_l',
    isLeader: false,
    avatarUrl: 'https://source.unsplash.com/random/100x100/?portrait&sig=9'
  }
];

const mockTeamMembers5: TeamMember[] = [
  {
    id: 'user-010',
    name: 'vincent_s',
    isLeader: true,
    avatarUrl: 'https://source.unsplash.com/random/100x100/?portrait&sig=10'
  },
  {
    id: 'user-011',
    name: 'chloe33',
    isLeader: false,
    avatarUrl: 'https://source.unsplash.com/random/100x100/?portrait&sig=11'
  },
  {
    id: 'user-012',
    name: 'jerome_p',
    isLeader: false,
    avatarUrl: 'https://source.unsplash.com/random/100x100/?portrait&sig=12'
  }
];

// Données simulées pour les équipes
const mockTeams: Team[] = [
  {
    id: 'team-001',
    name: 'Les Chasseurs de Poulet',
    avatarUrl: 'https://source.unsplash.com/random/200x200/?chicken&sig=1',
    score: 325,
    barsVisited: 3,
    challengesCompleted: 2,
    foundChicken: false,
    members: mockTeamMembers1
  },
  {
    id: 'team-002',
    name: 'Équipe KFC',
    avatarUrl: 'https://source.unsplash.com/random/200x200/?chicken&sig=2',
    score: 410,
    barsVisited: 4,
    challengesCompleted: 3,
    foundChicken: false,
    members: mockTeamMembers2
  },
  {
    id: 'team-003',
    name: 'Équipe Poule Position',
    avatarUrl: 'https://source.unsplash.com/random/200x200/?chicken&sig=3',
    score: 275,
    barsVisited: 2,
    challengesCompleted: 3,
    foundChicken: false,
    members: mockTeamMembers3
  },
  {
    id: 'team-004',
    name: 'Équipe Cocorico',
    avatarUrl: 'https://source.unsplash.com/random/200x200/?chicken&sig=4',
    score: 225,
    barsVisited: 2,
    challengesCompleted: 1,
    foundChicken: false,
    members: mockTeamMembers4
  },
  {
    id: 'team-005',
    name: 'Chicken Run',
    avatarUrl: 'https://source.unsplash.com/random/200x200/?chicken&sig=5',
    score: 500,
    barsVisited: 0,
    challengesCompleted: 0,
    foundChicken: true,
    members: mockTeamMembers5
  }
];

// Données simulées pour les défis
const mockChallenges: Challenge[] = [
  {
    id: 'challenge-001',
    title: 'Photo avec un inconnu',
    description: 'Trouvez quelqu\'un qui porte un vêtement rouge et prenez un selfie avec cette personne.',
    points: 50,
    active: true
  },
  {
    id: 'challenge-002',
    title: 'Danse en public',
    description: 'Filmez un membre de votre équipe en train de faire une danse de poulet pendant 30 secondes.',
    points: 100,
    active: true
  },
  {
    id: 'challenge-003',
    title: 'Cocktail mystère',
    description: 'Commandez un cocktail au bar et faites deviner ses ingrédients à votre équipe.',
    points: 75,
    active: true
  },
  {
    id: 'challenge-004',
    title: 'Karaoké improvisé',
    description: 'Chantez une chanson avec les paroles modifiées pour inclure le mot "poulet" au moins 3 fois.',
    points: 125,
    active: false
  },
  {
    id: 'challenge-005',
    title: 'Tour de magie',
    description: 'Réalisez un tour de magie simple pour un inconnu dans un bar.',
    points: 75,
    active: true
  },
  {
    id: 'challenge-006',
    title: 'Photo de groupe',
    description: 'Prenez une photo avec au moins 5 inconnus dans un bar.',
    points: 100,
    active: false
  }
];

// Données simulées pour les complétion de défis
const mockChallengeCompletions: ChallengeCompletion[] = [
  {
    id: 'completion-001',
    challengeId: 'challenge-001',
    teamId: 'team-001',
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    status: 'approved',
    photoUrl: 'https://source.unsplash.com/random/800x600/?selfie&sig=1'
  },
  {
    id: 'completion-002',
    challengeId: 'challenge-002',
    teamId: 'team-002',
    timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    status: 'approved',
    photoUrl: 'https://source.unsplash.com/random/800x600/?dance&sig=2'
  },
  {
    id: 'completion-003',
    challengeId: 'challenge-003',
    teamId: 'team-003',
    timestamp: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    status: 'rejected',
    photoUrl: 'https://source.unsplash.com/random/800x600/?cocktail&sig=3'
  },
  {
    id: 'completion-004',
    challengeId: 'challenge-005',
    teamId: 'team-001',
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    status: 'approved',
    photoUrl: 'https://source.unsplash.com/random/800x600/?magic&sig=4'
  },
  {
    id: 'completion-005',
    challengeId: 'challenge-001',
    teamId: 'team-002',
    timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    status: 'approved',
    photoUrl: 'https://source.unsplash.com/random/800x600/?selfie&sig=5'
  },
  {
    id: 'completion-006',
    challengeId: 'challenge-003',
    teamId: 'team-002',
    timestamp: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
    status: 'approved',
    photoUrl: 'https://source.unsplash.com/random/800x600/?cocktail&sig=6'
  },
  {
    id: 'completion-007',
    challengeId: 'challenge-003',
    teamId: 'team-004',
    timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    status: 'pending',
    photoUrl: 'https://source.unsplash.com/random/800x600/?cocktail&sig=7'
  },
  {
    id: 'completion-008',
    challengeId: 'challenge-005',
    teamId: 'team-003',
    timestamp: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
    status: 'pending',
    photoUrl: 'https://source.unsplash.com/random/800x600/?magic&sig=8'
  }
];

// Données simulées pour les messages
const mockMessages: Message[] = [
  {
    id: 'message-001',
    gameId: 'game-001',
    userId: 'user-001',
    sender: 'alex93',
    content: 'Est-ce que quelqu\'un a vu le poulet près de Pigalle ?',
    timestamp: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
    isClue: false
  },
  {
    id: 'message-002',
    gameId: 'game-001',
    userId: 'user-005',
    sender: 'Le Poulet',
    content: 'Je suis quelque part où les coqs chantent...',
    timestamp: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    isClue: true
  },
  {
    id: 'message-003',
    gameId: 'game-001',
    userId: 'user-003',
    sender: 'thomas75',
    content: 'On a vérifié au Coq Sportif, il n\'y est pas !',
    timestamp: new Date(Date.now() - 32 * 60 * 1000).toISOString(),
    isClue: false
  },
  {
    id: 'message-004',
    gameId: 'game-001',
    userId: 'system',
    sender: 'Système',
    content: 'L\'équipe KFC a complété un défi !',
    timestamp: new Date(Date.now() - 28 * 60 * 1000).toISOString(),
    isClue: false
  },
  {
    id: 'message-005',
    gameId: 'game-001',
    userId: 'user-005',
    sender: 'Le Poulet',
    content: 'J\'ai une préférence pour les œufs brouillés...',
    timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    isClue: true
  },
  {
    id: 'message-006',
    gameId: 'game-001',
    userId: 'user-006',
    sender: 'emma_b',
    content: 'On se dirige vers Les Œufs d\'Or !',
    timestamp: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    isClue: false
  },
  {
    id: 'message-007',
    gameId: 'game-001',
    userId: 'user-005',
    sender: 'Le Poulet',
    content: 'J\'ai changé d\'endroit, je préfère les endroits ivres maintenant...',
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    isClue: true
  },
  {
    id: 'message-008',
    gameId: 'game-001',
    userId: 'user-010',
    sender: 'vincent_s',
    content: 'Je pense savoir où il est ! On fonce au Poulet Ivre !',
    timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    isClue: false
  },
  {
    id: 'message-009',
    gameId: 'game-001',
    userId: 'system',
    sender: 'Système',
    content: 'L\'équipe Chicken Run a trouvé le poulet ! Félicitations !',
    timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    isClue: false
  },
  {
    id: 'message-010',
    gameId: 'game-001',
    userId: 'user-005',
    sender: 'Vous',
    content: 'Bien joué à tous ! La partie continue pour les défis',
    timestamp: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
    isClue: false
  }
];

// État du jeu pour l'interface Chicken
export const mockChickenGameState: ChickenGameState = {
  game: mockGame,
  teams: mockTeams,
  challenges: mockChallenges,
  challengeCompletions: mockChallengeCompletions,
  messages: mockMessages,
  currentBar: mockBars[3], // Le Poulet Ivre
  timeLeft: '2:15:00',
  barOptions: mockBars
}; 