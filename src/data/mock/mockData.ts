import { 
  ChickenGameState, 
  Game, 
  Bar, 
  Team, 
  TeamMember, 
  Challenge, 
  ChallengeCompletion,
  Message,
  Location
} from '../types';

// Données simulées pour le jeu
const mockGame: Game = {
  id: 'game-001',
  name: 'La Course du Poulet - Édition Bruxelles',
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
    address: '15 Rue Antoine Dansaert, 1000 Bruxelles',
    description: 'Un bar sportif avec une bonne sélection de bières belges.',
    photoUrl: 'https://picsum.photos/seed/bar1/800/600',
    latitude: 50.8505,
    longitude: 4.3461
  },
  {
    id: 'bar-002',
    name: 'Chez Poule & Coq',
    address: '22 Place Sainte-Catherine, 1000 Bruxelles',
    description: 'Un bistrot traditionnel belge avec des cocktails signature.',
    photoUrl: 'https://picsum.photos/seed/bar2/800/600',
    latitude: 50.8531,
    longitude: 4.3479
  },
  {
    id: 'bar-003',
    name: 'La Plume Dorée',
    address: '7 Rue du Marché aux Herbes, 1000 Bruxelles',
    description: 'Bar chic avec musique live et cocktails artisanaux.',
    photoUrl: 'https://picsum.photos/seed/bar3/800/600',
    latitude: 50.8462,
    longitude: 4.3525
  },
  {
    id: 'bar-004',
    name: 'Le Poulet Ivre',
    address: '10 Rue des Bouchers, 1000 Bruxelles',
    description: 'Bar à thème avec décoration inspirée de la volaille.',
    photoUrl: 'https://picsum.photos/seed/bar4/800/600',
    latitude: 50.8478,
    longitude: 4.3540
  },
  {
    id: 'bar-005',
    name: 'Les Œufs d\'Or',
    address: '25 Rue du Midi, 1000 Bruxelles',
    description: 'Petit bar intime avec une ambiance conviviale.',
    photoUrl: 'https://picsum.photos/seed/bar5/800/600',
    latitude: 50.8448,
    longitude: 4.3490
  },
  // --- Add Placeholder Bars (6 to 25) ---
  {
    id: 'bar-006',
    name: 'Placeholder Bar 6',
    address: 'Placeholder Address 6',
    description: 'Placeholder Description 6',
    photoUrl: 'https://picsum.photos/seed/bar6/800/600',
    latitude: 50.8420,
    longitude: 4.3580
  },
  {
    id: 'bar-007',
    name: 'Placeholder Bar 7',
    address: 'Placeholder Address 7',
    description: 'Placeholder Description 7',
    photoUrl: 'https://picsum.photos/seed/bar7/800/600',
    latitude: 50.8510,
    longitude: 4.3450
  },
  {
    id: 'bar-008',
    name: 'Placeholder Bar 8',
    address: 'Placeholder Address 8',
    description: 'Placeholder Description 8',
    photoUrl: 'https://picsum.photos/seed/bar8/800/600',
    latitude: 50.8495,
    longitude: 4.3515
  },
  {
    id: 'bar-009',
    name: 'Placeholder Bar 9',
    address: 'Placeholder Address 9',
    description: 'Placeholder Description 9',
    photoUrl: 'https://picsum.photos/seed/bar9/800/600',
    latitude: 50.8455,
    longitude: 4.3505
  },
  {
    id: 'bar-010',
    name: 'Placeholder Bar 10',
    address: 'Placeholder Address 10',
    description: 'Placeholder Description 10',
    photoUrl: 'https://picsum.photos/seed/bar10/800/600',
    latitude: 50.8470,
    longitude: 4.3475
  },
  {
    id: 'bar-011',
    name: 'Placeholder Bar 11',
    address: 'Placeholder Address 11',
    description: 'Placeholder Description 11',
    photoUrl: 'https://picsum.photos/seed/bar11/800/600',
    latitude: 50.8520,
    longitude: 4.3520
  },
  {
    id: 'bar-012',
    name: 'Placeholder Bar 12',
    address: 'Placeholder Address 12',
    description: 'Placeholder Description 12',
    photoUrl: 'https://picsum.photos/seed/bar12/800/600',
    latitude: 50.8535,
    longitude: 4.3545
  },
  {
    id: 'bar-013',
    name: 'Placeholder Bar 13',
    address: 'Placeholder Address 13',
    description: 'Placeholder Description 13',
    photoUrl: 'https://picsum.photos/seed/bar13/800/600',
    latitude: 50.8490,
    longitude: 4.3565
  },
  {
    id: 'bar-014',
    name: 'Placeholder Bar 14',
    address: 'Placeholder Address 14',
    description: 'Placeholder Description 14',
    photoUrl: 'https://picsum.photos/seed/bar14/800/600',
    latitude: 50.8430,
    longitude: 4.3500
  },
  {
    id: 'bar-015',
    name: 'Placeholder Bar 15',
    address: 'Placeholder Address 15',
    description: 'Placeholder Description 15',
    photoUrl: 'https://picsum.photos/seed/bar15/800/600',
    latitude: 50.8445,
    longitude: 4.3530
  }
];

// Emplacements simulés d'équipes à Bruxelles
const mockLocations: Record<string, Location> = {
  'team-001': {
    latitude: 50.8495,
    longitude: 4.3470,
    timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    accuracy: 15
  },
  'team-002': {
    latitude: 50.8515,
    longitude: 4.3490,
    timestamp: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
    accuracy: 10
  },
  'team-003': {
    latitude: 50.8465,
    longitude: 4.3510,
    timestamp: new Date(Date.now() - 7 * 60 * 1000).toISOString(),
    accuracy: 20
  },
  'team-004': {
    latitude: 50.8485,
    longitude: 4.3460,
    timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    accuracy: 8
  },
  'team-005': {
    latitude: 50.8480,
    longitude: 4.3538, // Proche du Poulet Ivre car cette équipe l'a trouvé
    timestamp: new Date(Date.now() - 1 * 60 * 1000).toISOString(),
    accuracy: 5
  }
};

// Données simulées pour les membres d'équipe
const mockTeamMembers1: TeamMember[] = [
  {
    id: 'user-001',
    name: 'alex93',
    isLeader: true,
    avatarUrl: 'https://picsum.photos/seed/user1/100/100'
  },
  {
    id: 'user-002',
    name: 'sophie22',
    isLeader: false,
    avatarUrl: 'https://picsum.photos/seed/user2/100/100'
  }
];

const mockTeamMembers2: TeamMember[] = [
  {
    id: 'user-003',
    name: 'thomas75',
    isLeader: true,
    avatarUrl: 'https://picsum.photos/seed/user3/100/100'
  },
  {
    id: 'user-004',
    name: 'julie_p',
    isLeader: false,
    avatarUrl: 'https://picsum.photos/seed/user4/100/100'
  },
  {
    id: 'user-005',
    name: 'marc44',
    isLeader: false,
    avatarUrl: 'https://picsum.photos/seed/user5/100/100'
  }
];

const mockTeamMembers3: TeamMember[] = [
  {
    id: 'user-006',
    name: 'emma_b',
    isLeader: true,
    avatarUrl: 'https://picsum.photos/seed/user6/100/100'
  },
  {
    id: 'user-007',
    name: 'lucas77',
    isLeader: false,
    avatarUrl: 'https://picsum.photos/seed/user7/100/100'
  }
];

const mockTeamMembers4: TeamMember[] = [
  {
    id: 'user-008',
    name: 'pauline23',
    isLeader: true,
    avatarUrl: 'https://picsum.photos/seed/user8/100/100'
  },
  {
    id: 'user-009',
    name: 'david_l',
    isLeader: false,
    avatarUrl: 'https://picsum.photos/seed/user9/100/100'
  }
];

const mockTeamMembers5: TeamMember[] = [
  {
    id: 'user-010',
    name: 'vincent_s',
    isLeader: true,
    avatarUrl: 'https://picsum.photos/seed/user10/100/100'
  },
  {
    id: 'user-011',
    name: 'chloe33',
    isLeader: false,
    avatarUrl: 'https://picsum.photos/seed/user11/100/100'
  },
  {
    id: 'user-012',
    name: 'jerome_p',
    isLeader: false,
    avatarUrl: 'https://picsum.photos/seed/user12/100/100'
  }
];

// Données simulées pour les équipes
const mockTeams: Team[] = [
  {
    id: 'team-001',
    name: 'Les Chasseurs de Poulet',
    avatarUrl: 'https://picsum.photos/seed/team1/200/200',
    score: 325,
    barsVisited: 3,
    challengesCompleted: 2,
    foundChicken: false,
    members: mockTeamMembers1,
    lastLocation: mockLocations['team-001']
  },
  {
    id: 'team-002',
    name: 'Équipe KFC',
    avatarUrl: 'https://picsum.photos/seed/team2/200/200',
    score: 410,
    barsVisited: 4,
    challengesCompleted: 3,
    foundChicken: false,
    members: mockTeamMembers2,
    lastLocation: mockLocations['team-002']
  },
  {
    id: 'team-003',
    name: 'Équipe Poule Position',
    avatarUrl: 'https://picsum.photos/seed/team3/200/200',
    score: 275,
    barsVisited: 2,
    challengesCompleted: 3,
    foundChicken: false,
    members: mockTeamMembers3,
    lastLocation: mockLocations['team-003']
  },
  {
    id: 'team-004',
    name: 'Équipe Cocorico',
    avatarUrl: 'https://picsum.photos/seed/team4/200/200',
    score: 225,
    barsVisited: 2,
    challengesCompleted: 1,
    foundChicken: false,
    members: mockTeamMembers4,
    lastLocation: mockLocations['team-004']
  },
  {
    id: 'team-005',
    name: 'Chicken Run',
    avatarUrl: 'https://picsum.photos/seed/team5/200/200',
    score: 500,
    barsVisited: 0,
    challengesCompleted: 0,
    foundChicken: true,
    members: mockTeamMembers5,
    lastLocation: mockLocations['team-005']
  }
];

// Données simulées pour les défis
const mockChallenges: Challenge[] = [
  {
    id: 'challenge-001',
    title: 'Trinquons entre inconnus!',
    description: 'Offrez un verre à un parfait inconnu dans le bar et immortalisez ce moment de générosité avec un selfie "tchin-tchin". ',
    points: 50,
    active: true,
    completed: false,
    teams: [],
    type: 'photo'
  },
  {
    id: 'challenge-002',
    title: 'Danse du poulet',
    description: 'Filmez un membre de votre équipe en train de faire une danse de poulet pendant 30 secondes.',
    points: 100,
    active: true,
    completed: false,
    teams: [],
    type: 'photo'
  },
  {
    id: 'challenge-003',
    title: 'Barman d\'un jour',
    description: 'Se retrouver derrière le comptoir à aider le barman et prendre une photo comme preuve.',
    points: 75,
    active: true,
    completed: false,
    teams: [],
    type: 'photo'
  },

  // --- New Challenges from Image (assuming photo based) ---
  {
    id: 'challenge-007',
    title: 'Faire un "à fond" de groupe devant le Manneken Pis',
    description: 'Faire un "à fond" de groupe devant le Manneken Pis',
    points: 100,
    active: true,
    completed: false,
    teams: [],
    type: 'photo'
  },
  {
    id: 'challenge-009',
    title: 'Demander et obtenir un "free hug" d\'un client inconnu',
    description: 'Demander et obtenir un "free hug" d\'un client inconnu',
    points: 200,
    active: true,
    completed: false,
    teams: [],
    type: 'photo'
  },
  // --- Riddle Challenges (Photo-based for now, could be unlock later) ---
  {
    id: 'challenge-017',
    title: 'Qu\'est-ce qui est petit et marron?',
    description: 'Une énigme pour les plus forts.',
    points: 350,
    active: true,
    completed: false,
    teams: [],
    type: 'unlock',
    correctAnswer: 'un marron'
  },
  {
    id: 'challenge-018',
    title: 'Maths à l\'Atomium',
    description: 'Si l\'Atomium a un nombre de sphères égal à la racine carrée de 81, et que chaque sphère a un diamètre de 18 mètres, quel est le produit du nombre de sphères par le diamètre d\'une sphère?',
    points: 125,
    active: true,
    completed: false,
    teams: [],
    type: 'unlock',
    correctAnswer: '162'
  },
  {
    id: 'challenge-019',
    title: 'Mur BD célèbre',
    description: 'Dans quelle rue se trouve le mur peint rendant hommage au reporter à la houppette et à son fidèle compagnon canin ?',
    points: 175,
    active: true,
    completed: false,
    teams: [],
    type: 'unlock',
    correctAnswer: 'Rue de l\'Étuve'
  }
  // --- More Subtle/Text-Hinted Challenges ---
  // --- End of New Challenges ---
];

// Données simulées pour les complétion de défis
const mockChallengeCompletions: ChallengeCompletion[] = [
  {
    id: 'completion-001',
    challengeId: 'challenge-001',
    teamId: 'team-001',
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    status: 'approved',
    photoUrl: 'https://picsum.photos/200/300?random=1'
  },
  {
    id: 'completion-002',
    challengeId: 'challenge-002',
    teamId: 'team-002',
    timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    status: 'approved',
    photoUrl: 'https://picsum.photos/200/300?random=2'
  },
  {
    id: 'completion-003',
    challengeId: 'challenge-003',
    teamId: 'team-003',
    timestamp: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    status: 'rejected',
    photoUrl: 'https://picsum.photos/200/300?random=3'
  },
  {
    id: 'completion-004',
    challengeId: 'challenge-005',
    teamId: 'team-001',
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    status: 'approved',
    photoUrl: 'https://picsum.photos/200/300?random=4'
  },
  {
    id: 'completion-005',
    challengeId: 'challenge-001',
    teamId: 'team-002',
    timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    status: 'approved',
    photoUrl: 'https://picsum.photos/200/300?random=5'
  },
  {
    id: 'completion-006',
    challengeId: 'challenge-003',
    teamId: 'team-002',
    timestamp: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
    status: 'approved',
    photoUrl: 'https://picsum.photos/200/300?random=6'
  },
  {
    id: 'completion-007',
    challengeId: 'challenge-003',
    teamId: 'team-004',
    timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    status: 'pending',
    photoUrl: 'https://picsum.photos/200/300?random=7'
  },
  {
    id: 'completion-008',
    challengeId: 'challenge-005',
    teamId: 'team-003',
    timestamp: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
    status: 'pending',
    photoUrl: 'https://picsum.photos/200/300?random=8'
  },
  {
    id: 'completion-009',
    challengeId: 'challenge-002',
    teamId: 'team-004',
    timestamp: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    status: 'approved',
    photoUrl: 'https://picsum.photos/200/300?random=9'
  },
  {
    id: 'completion-010',
    challengeId: 'challenge-001',
    teamId: 'team-003',
    timestamp: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
    status: 'approved',
    photoUrl: 'https://picsum.photos/200/300?random=10'
  }
];

// Données simulées pour les messages
const mockMessages: Message[] = [
  {
    id: 'message-001',
    gameId: 'game-001',
    userId: 'system',
    sender: 'Système',
    content: 'Bienvenue dans La Course du Poulet ! 🐔 La chasse commence. Décompte: 2h30.',
    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    isClue: false
  },
  {
    id: 'message-003',
    gameId: 'game-001',
    userId: 'chicken',
    sender: 'Le Poulet',
    content: 'Je suis quelque part où les coqs chantent...',
    timestamp: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    isClue: true
  },
  {
    id: 'message-004',
    gameId: 'game-001',
    userId: 'system',
    sender: 'Système',
    content: 'L\'équipe KFC a complété le défi "Trinquons entre inconnus" ! +50 points',
    timestamp: new Date(Date.now() - 32 * 60 * 1000).toISOString(),
    isClue: false
  },
  {
    id: 'message-005',
    gameId: 'game-001',
    userId: 'system',
    sender: 'Système',
    content: 'Mise à jour du classement : 1. KFC (110pts), 2. Chasseurs de Poulet (75pts), 3. Poule Position (50pts)',
    timestamp: new Date(Date.now() - 28 * 60 * 1000).toISOString(),
    isClue: false
  },
  {
    id: 'message-006',
    gameId: 'game-001',
    userId: 'chicken',
    sender: 'Le Poulet',
    content: 'J\'ai une préférence pour les œufs brouillés...',
    timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    isClue: true
  },
  {
    id: 'message-007',
    gameId: 'game-001',
    userId: 'system',
    sender: 'Système',
    content: 'Cagnotte mise à jour : 650€ restants (-50€)',
    timestamp: new Date(Date.now() - 22 * 60 * 1000).toISOString(),
    isClue: false,
    isCagnotteEvent: true,
    amount: -50
  },
  {
    id: 'message-008',
    gameId: 'game-001',
    userId: 'chicken',
    sender: 'Le Poulet',
    content: 'J\'ai changé d\'endroit, je préfère les endroits ivres maintenant...',
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    isClue: true
  },
  {
    id: 'message-009',
    gameId: 'game-001',
    userId: 'system',
    sender: 'Système',
    content: 'Le bar "Les Œufs d\'Or" a été retiré de la liste ! Il n\'y a plus de poulet ici.',
    timestamp: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    isClue: false,
    isBarRemoval: true,
    barId: 'bar-005'
  },
  {
    id: 'message-010',
    gameId: 'game-001',
    userId: 'system',
    sender: 'Système',
    content: 'L\'équipe Chicken Run a trouvé le poulet ! Félicitations !',
    timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    isClue: false
  },
  {
    id: 'message-011',
    gameId: 'game-001',
    userId: 'system',
    sender: 'Système',
    content: 'Mise à jour du classement : 1. Chicken Run (500pts), 2. KFC (410pts), 3. Chasseurs de Poulet (325pts)',
    timestamp: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
    isClue: false
  },
  {
    id: 'message-012',
    gameId: 'game-001',
    userId: 'chicken',
    sender: 'Le Poulet',
    content: 'Je me cache toujours, mais peut-être pas pour longtemps...',
    timestamp: new Date(Date.now() - 1 * 60 * 1000).toISOString(),
    isClue: true
  },
  {
    id: 'message-013',
    gameId: 'game-001',
    userId: 'system',
    sender: 'Système',
    content: 'Cagnotte mise à jour : 350€ restants (-100€)',
    timestamp: new Date(Date.now()).toISOString(),
    isClue: false,
    isCagnotteEvent: true,
    amount: -100
  },
  // New photo clues
  {
    id: 'message-014',
    gameId: 'game-001',
    userId: 'chicken',
    sender: 'Le Poulet',
    content: 'Voici une vue depuis ma cachette actuelle...',
    timestamp: new Date(Date.now() + 2 * 60 * 1000).toISOString(),
    isClue: true,
    photoUrl: 'https://picsum.photos/id/164/500/300' // Random Belgian street pic
  },
  {
    id: 'message-015',
    gameId: 'game-001',
    userId: 'chicken',
    sender: 'Le Poulet',
    content: 'Est-ce que vous reconnaissez cette enseigne ?',
    timestamp: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    isClue: true,
    photoUrl: 'https://picsum.photos/id/665/500/300' // Random store sign pic
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
  barOptions: mockBars,
  isChickenHidden: false, // Le poulet n'est pas encore caché
  hidingTimeLeft: '25:00', // 25 minutes restantes pour se cacher
  // --- Hypothetical Cagnotte Values ---
  initialCagnotte: 800, // Initial cagnotte of 800 EUR
  currentCagnotte: 350,  // Current remaining amount
  // -----------------------------------
}; 