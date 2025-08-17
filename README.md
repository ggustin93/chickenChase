# Chicken Chase - Social Party Game Platform

⚠️ **Important Notice**

This repository is a social gaming platform under active development. The codebase contains incomplete features and is designed for group entertainment purposes. This project is not intended for commercial use without proper testing and validation in production environments.

This project is a mobile-first Progressive Web Application (PWA) designed to digitize and enhance a real-world social party game. It demonstrates modern web application architecture using React, Supabase, and real-time synchronization for group gaming experiences.

## Table of Contents

- [Features](#features)
- [Architecture Overview](#architecture-overview)
- [Tech Stack](#tech-stack)
- [Testing Strategy](#testing-strategy)
- [Development Scripts](#development-scripts)
- [Local Development](#local-development)
- [Game Flow](#game-flow)
- [Roadmap](#roadmap)
- [License](#license)

## 1. Features

**Social Game Orchestration**: Create and join games with unique 6-character codes, supporting anonymous session management without required authentication for seamless party game experiences.

**Real-time Team Management**: Dynamic team formation with live updates across all players, featuring Chicken team (hiders) and Hunter teams (seekers) with instant synchronization using Supabase Realtime.

**Mobile-First PWA Experience**: Native app-like experience with offline capabilities, installation prompts, and optimized touch interactions designed for mobile devices and social gaming scenarios.

**Live Game State Synchronization**: Real-time game status updates with automatic player redirection, ensuring all participants stay synchronized throughout the game lifecycle from lobby to completion.

**Challenge System**: Photo-based challenge submissions with validation workflow, allowing Hunter teams to complete objectives while Chicken team validates submissions with point attribution.

**Cagnotte Management**: Real-time pot management system where Chicken team manages shared funds with live balance updates visible to all players, enhancing the social gaming experience.

**Responsive Design System**: Professional theming with glassmorphism effects, mobile-optimized layouts, and accessibility compliance for diverse gaming environments and device capabilities.

## 2. Architecture Overview

The Chicken Chase platform implements a mobile-first PWA architecture designed around real-time multiplayer gaming, anonymous session management, and social interaction optimization.

### How the Architecture Works

When players create or join a game, the system initiates a social gaming workflow: **(1) Game Creation** - Host creates game with configuration parameters and receives unique join code, **(2) Anonymous Sessions** - Players join using localStorage-based sessions without authentication requirements, **(3) Real-time Lobby** - Team formation with live updates across all connected players using Supabase subscriptions, **(4) Role Assignment** - Chicken team (hiders) and Hunter teams (seekers) with automatic role-based interface switching, **(5) Game Orchestration** - Centralized game state management with SQL functions ensuring data consistency, and **(6) Live Synchronization** - Real-time updates for challenges, scores, and cagnotte management across all participants.

The frontend maintains reactive state through React Context and custom hooks, ensuring the UI reflects real-time changes without manual refreshes. The backend uses PostgreSQL functions for atomic operations and Supabase Realtime for instant synchronization across all players.

### 2.1 High-Level Diagram

```
┌─────────────────────────┐      ┌───────────────────────────┐      ┌─────────────────────────┐
│   Ionic React PWA       │◄──── │    Supabase Backend       │ ───► │   PostgreSQL Database   │
│ (Mobile-First Design)   │ HTTP │  (Realtime + Storage)     │ SQL  │ (Game State + RLS)      │
├─────────────────────────┤      ├───────────────────────────┤      ├─────────────────────────┤
│ - Session Context       │      │ - Realtime Subscriptions  │      │ - Game Management       │
│ - Touch Interactions    │      │ - File Storage (Photos)   │      │ - Team Coordination     │
│ - PWA Service Worker    │      │ - Authentication (Optional)│      │ - Challenge System      │
│ - Responsive Components │      │ - RPC Functions           │      │ - Event Notifications   │
└─────────────────────────┘      └────────────┬──────────────┘      └─────────────────────────┘
                                              │ Real-time
                                              ▼
                               ┌───────────────────────────┐
                               │   Game Orchestration      │
                               │                           │
                               │ ┌─────────────────────────┐ │
                               │ │   Session Management    │ │ ──► localStorage, Context
                               │ │   (Anonymous Players)   │ │
                               │ └─────────────────────────┘ │
                               │ ┌─────────────────────────┐ │
                               │ │   Real-time Sync        │ │ ──► Supabase Channels
                               │ │   (Live Updates)        │ │
                               │ └─────────────────────────┘ │
                               │ ┌─────────────────────────┐ │
                               │ │   Game State Logic      │ │ ──► SQL Functions
                               │ │   (Status Transitions)  │ │
                               │ └─────────────────────────┘ │
                               └───────────────────────────┘
```

### 2.2 Game State Management

The system implements **Centralized Game State** architecture with PostgreSQL functions:

**SQL Functions Priority**: All critical game operations use PostgreSQL functions (`update_game_status`, `create_game_and_host`) ensuring data consistency and automatic event generation for real-time notifications.

**Key Implementation Patterns**:

- **Atomic Operations**: Game status changes trigger history logging and real-time events
- **Real-time Events**: `game_events` table broadcasts changes to all connected players  
- **Session Persistence**: localStorage-based anonymous sessions with automatic reconnection
- **Error Recovery**: Graceful handling of network issues with manual refresh capabilities

### 2.3 Source Code Structure

```
src/
├── components/
│   ├── admin/                     # Game creation and admin interface
│   ├── chicken/                   # Chicken team specific components
│   ├── player/                    # Hunter team components
│   ├── shared/                    # Reusable UI components
│   └── layout/                    # App layout and navigation
├── contexts/
│   └── SessionContext.tsx         # Global session management
├── hooks/
│   ├── useChickenGameState.ts     # Chicken team game logic
│   ├── usePlayerGameData.ts       # Hunter team data management
│   └── useRealtimeCagnotte.ts     # Real-time pot management
├── pages/
│   ├── HomePage.tsx               # Game creation and joining
│   ├── LobbyPage.tsx              # Team formation and waiting
│   ├── ChickenPage.tsx            # Chicken team interface
│   └── PlayerPage.tsx             # Hunter team interface
├── services/
│   ├── GameService.ts             # Game CRUD operations
│   ├── TeamService.ts             # Team management
│   └── CagnotteService.ts         # Pot management
└── types/
    └── types.ts                   # TypeScript definitions
```

## 3. Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Ionic React, TypeScript, Tailwind CSS, Capacitor |
| **Backend** | Supabase (PostgreSQL, Realtime, Storage, Auth) |
| **PWA** | Service Worker, Web App Manifest, Offline Support |
| **Real-time** | Supabase Realtime subscriptions, WebSocket connections |
| **Storage** | Supabase Storage for photos, localStorage for sessions |
| **Testing** | Vitest (unit), Playwright (E2E), TypeScript strict mode |
| **DevOps** | Vite build system, ESLint, Git workflows |

## 4. Testing Strategy

### 4.1 Current Test Coverage

✅ **Frontend Unit Tests**: Component logic validation
- Session management and context state
- Game flow hooks and data transformations  
- UI component interactions and responsive behavior
- Real-time subscription handling and cleanup

✅ **E2E Critical Scenarios**: Playwright automated testing
- **Complete game flow validated** (creation → join → teams → launch → play)
- **Real-time synchronization**: <1s latency across all players
- **Role-based redirection**: Automatic Chicken/Hunter interface switching
- **Multi-browser testing**: Concurrent player simulation verified
- **100% test success rate** with zero critical issues

### 4.2 Test Categories

**Core Game Flows**:
- Game creation with unique code generation
- Multi-player lobby with real-time team formation
- Role-based redirection (Chicken vs Hunter interfaces)
- Challenge system with photo upload and validation
- Cagnotte management with live balance updates

**Mobile PWA Testing**:
- Touch interactions and gesture handling
- Responsive design across device breakpoints
- PWA installation and offline functionality
- Local storage session persistence

**Real-time Synchronization**:
- Live updates across multiple browser contexts
- Game state changes with automatic player redirection
- Challenge notifications and score updates
- Network resilience and error recovery

## 5. Development Scripts

```bash
# Development Environment
npm run dev                        # Start development server
npm run start                      # Alternative: Ionic serve

# Building and Testing  
npm run build                      # Production build with TypeScript check
npm run test.unit                  # Unit tests with Vitest
npm run test.e2e                   # E2E tests with Playwright
npm run lint                       # ESLint analysis

# Utility Scripts
npm run list                       # Available development scripts
npm run generate                   # Code/component generation
```

## 6. Local Development

### 6.1 Prerequisites

- **Node.js** 18+ with npm
- **Git** for version control
- **Supabase** account for backend services
- **Modern browser** with PWA support

### 6.2 Quick Start

1. **Clone and Install**
```bash
git clone https://github.com/yourusername/chicken-chase.git
cd chickenChase
npm install
```

2. **Environment Configuration**
```bash
# Create .env file
echo "VITE_SUPABASE_URL=your_supabase_url" > .env
echo "VITE_SUPABASE_ANON_KEY=your_anon_key" >> .env
```

3. **Database Setup**
- Import SQL migration from `supabase/migrations/`
- Configure Row Level Security (RLS) policies
- Set up Realtime subscriptions

4. **Launch Development**
```bash
npm run dev
# Application available at http://localhost:5173
```

### 6.3 Database Schema

Key tables for game functionality:
- **games**: Master game sessions with status and configuration
- **teams**: Team management with Chicken/Hunter differentiation  
- **players**: Anonymous player sessions with localStorage integration
- **challenges**: Challenge definitions and validation workflows
- **challenge_submissions**: Photo submissions with approval status
- **game_events**: Real-time event notifications
- **game_status_history**: Complete audit trail of game changes

## 7. Game Flow

### 7.1 Core Gameplay Cycle

1. **Game Creation**: Host creates game with configuration (max teams, duration, initial pot)
2. **Player Joining**: Players join with 6-character code and nickname (no auth required)
3. **Team Formation**: Dynamic team creation with Chicken team (hiders) and Hunter teams (seekers)
4. **Game Launch**: Chicken team starts game when ≥1 Hunter team exists
5. **Active Gameplay**: 
   - Hunters complete challenges and visit locations
   - Chicken team validates submissions and manages pot
   - Real-time score updates and communication
6. **Game Completion**: Chicken team ends game with final scoring

### 7.2 Role-Specific Interfaces

**Chicken Team (Hiders)**:
- Challenge validation with photo review
- Cagnotte (pot) management with transaction history
- Game control (start/finish) with confirmation dialogs
- Real-time monitoring of Hunter team activities

**Hunter Teams (Seekers)**:
- Interactive map with location tracking
- Challenge completion with photo submission
- Team chat and coordination tools
- Live leaderboard and score tracking

## 8. Roadmap

### 8.1 Performance & Scalability
- **Real-time Optimization**: Enhanced WebSocket connection management and reconnection strategies
- **Mobile Performance**: Advanced PWA caching strategies and offline game state management
- **Load Testing**: Multi-player scalability testing with large game sessions

### 8.2 Enhanced Gaming Features
- **Advanced Challenges**: GPS-based location verification and timed challenges
- **Social Features**: Enhanced team communication and game history
- **Customization**: Themeable interfaces and configurable game rules

### 8.3 Technical Improvements
- **TypeScript Strict Mode**: Enhanced type safety and developer experience
- **E2E Test Coverage**: Comprehensive Playwright scenarios for all game flows
- **Monitoring**: Application performance monitoring and error tracking

### 8.4 Current Development Focus
- **Real-time Reliability**: Ensuring consistent synchronization across all players
- **Mobile Optimization**: PWA performance on diverse mobile devices
- **Error Resilience**: Graceful handling of network issues and edge cases

## 9. License

This project is developed for entertainment and educational purposes. Please see the LICENSE.md file for detailed terms and conditions.

---