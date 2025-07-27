# Database CRUD System Documentation

## Overview

This document describes the comprehensive CRUD (Create, Read, Update, Delete) system for the Chicken Chase application, built on top of Supabase with TypeScript for full type safety.

## Architecture

### Base Service Layer

The system is built around a base `DatabaseService` class that provides common CRUD operations for all tables:

```typescript
import { DatabaseService } from './services/base/DatabaseService';
import type { ApiResponse, FilterOptions, QueryOptions } from './services';

// Every service extends this base class
class MyService extends DatabaseService<'table_name', RecordType, InsertType, UpdateType> {
  protected tableName = 'table_name' as const;
}
```

### Type Safety

All operations are fully typed using TypeScript interfaces that match the exact database schema:

```typescript
// Database types match exactly with Supabase schema
interface DbGame {
  id: string;
  created_at: string;
  status: GameStatus;
  // ... other fields
}

// Insert types (optional fields)
interface DbGameInsert {
  id?: string;
  status?: GameStatus;
  // ... required fields
}

// Update types (all optional)
interface DbGameUpdate {
  status?: GameStatus;
  // ... updatable fields
}
```

## Available Services

### 1. GameService

Handles all game-related operations:

```typescript
import { gameService } from './services';

// Create a game with host
const result = await gameService.createGameWithHost({
  cagnotte_initial: 5000, // in cents
  cagnotte_current: 5000,
  join_code: 'ABC123'
}, 'PlayerNickname');

// Update game status
await gameService.updateStatus('game-id', 'in_progress', 'player-id');

// Get game with relations
const gameWithData = await gameService.findByIdWithRelations('game-id');
```

**Key Methods:**
- `createGameWithHost()` - Create game with host player
- `updateStatus()` - Update game status with history tracking
- `startGame()` - Change status to in_progress
- `hideChicken()` - Change status to chicken_hidden
- `finishGame()` - Change status to finished
- `setChickenTeam()` - Assign chicken team
- `updateCagnotte()` - Update money pool

### 2. TeamService

Handles team operations:

```typescript
import { teamService } from './services';

// Create a team
const team = await teamService.createTeam('game-id', 'Team Name', false);

// Add points to team
await teamService.addPoints('team-id', 50);

// Mark chicken team
await teamService.setAsChickenTeam('team-id');

// Get leaderboard
const leaderboard = await teamService.getLeaderboard('game-id');
```

**Key Methods:**
- `createTeam()` - Create new team
- `setAsChickenTeam()` - Designate as chicken team
- `addPoints()` - Add points to score
- `incrementBarsVisited()` - Track bar visits
- `incrementChallengesCompleted()` - Track challenge completions
- `getLeaderboard()` - Get ranked teams

### 3. PlayerService

Manages player operations:

```typescript
import { playerService } from './services';

// Create a player
const player = await playerService.createPlayer('game-id', 'Nickname', 'user-id');

// Join a team
await playerService.joinTeam('player-id', 'team-id');

// Check nickname availability
const available = await playerService.isNicknameAvailable('game-id', 'NewNick');
```

**Key Methods:**
- `createPlayer()` - Create new player
- `joinTeam()` - Join a team
- `leaveTeam()` - Leave current team
- `updateNickname()` - Change nickname
- `linkToUser()` - Link to authenticated user

### 4. ChallengeService & ChallengeSubmissionService

Handle challenges and submissions:

```typescript
import { challengeService, challengeSubmissionService } from './services';

// Create default challenges
await challengeService.createDefaultChallenges();

// Submit a challenge
await challengeSubmissionService.submitChallenge(
  'challenge-id', 
  'team-id', 
  'game-id', 
  'photo-url'
);

// Auto-validate unlock challenges
await challengeSubmissionService.validateUnlockChallenge(
  'challenge-id',
  'team-id', 
  'game-id',
  'submitted-answer'
);
```

**Key Methods:**
- `createDefaultChallenges()` - Set up default challenges
- `submitChallenge()` - Submit challenge completion
- `approveSubmission()` - Approve submission
- `validateUnlockChallenge()` - Auto-validate unlock type

### 5. GameBarService

Manages bars in games:

```typescript
import { gameBarService } from './services';

// Import bars to game
const bars = await gameBarService.importBarsToGame('game-id', barsList);

// Mark bar as visited
await gameBarService.markBarAsVisited('game-id', 'bar-id', 'team-id');

// Get game statistics
const stats = await gameBarService.getGameBarStats('game-id');
```

**Key Methods:**
- `importBarsToGame()` - Import bars from external sources
- `markBarAsVisited()` - Mark bar as visited by team
- `findBarsNearLocation()` - Get bars near coordinates
- `getGameBarStats()` - Get visit statistics

### 6. GameEventService

Handles real-time events:

```typescript
import { gameEventService } from './services';

// Create events
await gameEventService.createGameStartedEvent('game-id', 'player-id');
await gameEventService.createBarVisitedEvent('game-id', 'team-id', 'bar-id', 'Bar Name');

// Subscribe to events
const subscription = gameEventService.subscribeToGameEvents(
  'game-id',
  (event) => console.log('New event:', event),
  ['bar_visited', 'challenge_completed'] // optional filter
);

// Unsubscribe
subscription.unsubscribe();
```

**Key Methods:**
- `createEvent()` - Create custom event
- `createGameStartedEvent()` - Game started event
- `createBarVisitedEvent()` - Bar visit event
- `createChallengeCompletedEvent()` - Challenge completion event
- `subscribeToGameEvents()` - Real-time subscription

## Common CRUD Operations

All services inherit these base operations:

### Reading Data

```typescript
// Get by ID
const game = await gameService.findById('game-id');

// Get multiple with filters
const activeGames = await gameService.findMany({ 
  eq: { status: 'lobby' } 
});

// Get with pagination
const games = await gameService.findPaginated(1, 20, {
  neq: { status: 'finished' }
});

// Count records
const count = await gameService.count({ eq: { status: 'lobby' } });

// Check existence
const exists = await gameService.exists({ eq: { join_code: 'ABC123' } });
```

### Filtering Options

```typescript
interface FilterOptions {
  eq?: Record<string, unknown>;        // Equal
  neq?: Record<string, unknown>;       // Not equal
  gt?: Record<string, unknown>;        // Greater than
  gte?: Record<string, unknown>;       // Greater than or equal
  lt?: Record<string, unknown>;        // Less than
  lte?: Record<string, unknown>;       // Less than or equal
  like?: Record<string, string>;       // Pattern match (case sensitive)
  ilike?: Record<string, string>;      // Pattern match (case insensitive)
  in?: Record<string, unknown[]>;      // In array
  is?: Record<string, unknown>;        // Is null/not null
  contains?: Record<string, unknown[]>; // Array/JSON contains
  containedBy?: Record<string, unknown[]>; // Array/JSON contained by
}
```

### Query Options

```typescript
interface QueryOptions {
  select?: string;                     // Columns to select
  orderBy?: { column: string; ascending?: boolean };
  limit?: number;                      // Limit results
  offset?: number;                     // Skip results
}
```

### Creating Data

```typescript
// Create single record
const newGame = await gameService.create({
  join_code: 'ABC123',
  cagnotte_initial: 5000,
  cagnotte_current: 5000
});

// Create multiple records
const teams = await teamService.createMany([
  { game_id: 'game-id', name: 'Team 1' },
  { game_id: 'game-id', name: 'Team 2' }
]);

// Upsert (insert or update)
const team = await teamService.upsert({
  id: 'team-id',
  name: 'Updated Name'
}, 'id');
```

### Updating Data

```typescript
// Update by ID
const updatedGame = await gameService.updateById('game-id', {
  status: 'in_progress'
});

// Update multiple records
const updatedTeams = await teamService.updateMany(
  { eq: { game_id: 'game-id' } },
  { score: 0 }
);
```

### Deleting Data

```typescript
// Delete by ID
await gameService.deleteById('game-id');

// Delete multiple records
await teamService.deleteMany({ eq: { game_id: 'game-id' } });
```

## Error Handling

All operations return a consistent `ApiResponse<T>` format:

```typescript
interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

// Usage
const result = await gameService.findById('game-id');
if (result.success) {
  console.log('Game:', result.data);
} else {
  console.error('Error:', result.error);
}
```

## Real-time Subscriptions

The system supports real-time updates via Supabase Realtime:

```typescript
// Subscribe to specific table changes
const subscription = supabase
  .channel('game-updates')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'games',
    filter: 'id=eq.game-id'
  }, (payload) => {
    console.log('Game updated:', payload.new);
  })
  .subscribe();

// Using the event service for structured events
const eventSub = gameEventService.subscribeToGameEvents(
  'game-id',
  (event) => handleGameEvent(event)
);
```

## Health Monitoring

Check service health:

```typescript
import { ServiceHealthCheck } from './services';

// Check all services
const health = await ServiceHealthCheck.checkAllServices();
console.log('All healthy:', health.healthy);
console.log('Service status:', health.services);

// Check specific service
const gameHealth = await ServiceHealthCheck.checkService('game');
```

## Migration Support

The system includes database migration with proper RLS policies and functions:

- **Row Level Security (RLS)** enabled on all tables
- **Database functions** for complex operations (game creation, status updates)
- **Triggers** for audit trails and automatic updates
- **Indexes** for performance optimization

## Best Practices

1. **Always check success/error** before using data
2. **Use filters** instead of fetching all data
3. **Implement pagination** for large datasets
4. **Use transactions** for related operations
5. **Subscribe to real-time events** for live updates
6. **Handle offline scenarios** gracefully
7. **Validate data** before database operations
8. **Use type safety** throughout the application

## Example: Complete Game Flow

```typescript
import { gameService, playerService, teamService, gameBarService } from './services';

// 1. Create game with host
const gameResult = await gameService.createGameWithHost({
  cagnotte_initial: 5000,
  cagnotte_current: 5000,
  join_code: 'ABC123'
}, 'HostPlayer');

if (!gameResult.success) {
  throw new Error(gameResult.error);
}

const { game, player } = gameResult.data;

// 2. Import bars
await gameBarService.importBarsToGame(game.id, importedBars);

// 3. Create teams
const chickenTeam = await teamService.createTeam(game.id, 'Chickens', true);
const hunterTeam = await teamService.createTeam(game.id, 'Hunters', false);

// 4. Set chicken team
await gameService.setChickenTeam(game.id, chickenTeam.data.id);

// 5. Start game
await gameService.startGame(game.id, player.id);

// 6. Hide chicken
await gameService.hideChicken(game.id, player.id);

// Game is now ready for players!
```

This CRUD system provides a robust, type-safe, and scalable foundation for the Chicken Chase application.