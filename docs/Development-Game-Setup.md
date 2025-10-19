# Development Game Setup Guide

Guide for creating realistic Brussels bar crawl games for development and testing.

## Quick Start

### Create a Brussels Game

```bash
# Using npm script (recommended)
npm run create-brussels-game

# Or directly
node scripts/create-brussels-game.js
```

This creates a complete game with:
- 🍺 8 authentic Brussels bars with real coordinates
- 🏆 16+ Belgian beer-themed challenges  
- 👥 5 teams with Belgian names
- 💰 100€ cagnotte
- ⏰ 3-hour duration

## Files Overview

### 1. Migration File
**Location**: `supabase/migrations/20250817000000_brussels_game_initializer.sql`

- **Purpose**: Database function for creating Brussels games
- **Function**: `create_brussels_game()` 
- **Usage**: Called by scripts or manually in Supabase dashboard
- **Safety**: Can be run multiple times, won't create duplicates

### 2. Node.js Script  
**Location**: `scripts/create-brussels-game.js`

- **Purpose**: User-friendly command-line interface
- **Usage**: `npm run create-brussels-game`
- **Features**: 
  - Environment validation
  - Colored output
  - Error handling
  - Connection testing

### 3. SQL Initialization Script
**Location**: `scripts/init-dev-data.sql`

- **Purpose**: Complete development data setup
- **Includes**: All Belgian challenges + Brussels game
- **Usage**: Execute in Supabase dashboard or CLI
- **Features**: Development views and cleanup functions

### 4. Documentation
**Location**: `docs/Development-Game-Setup.md` (this file)

- **Purpose**: Usage instructions and best practices

## Setup Instructions

### Prerequisites

1. **Supabase Project**: Configured and running
2. **Environment Variables**: Set in `.env` file
   ```env
   VITE_SUPABASE_URL=your_project_url
   VITE_SUPABASE_ANON_KEY=your_anon_key
   ```
3. **Migration Applied**: Run the migration first
   ```bash
   supabase db push
   # Or apply specific migration
   supabase db reset
   ```

### First Time Setup

1. **Apply Migration**:
   ```bash
   # Push all migrations
   supabase db push
   ```

2. **Create Initial Game**:
   ```bash
   npm run create-brussels-game
   ```

3. **Verify Setup**: Check the output for join code and game details

## Usage Examples

### Creating Multiple Games

```bash
# Create multiple test games
npm run create-brussels-game
npm run create-brussels-game
npm run create-brussels-game
```

Each game gets a unique join code (BRUX + 2 random chars).

### Manual Database Usage

```sql
-- Create a Brussels game
SELECT * FROM create_brussels_game();

-- View all games
SELECT * FROM dev_games_overview;

-- View challenges
SELECT * FROM dev_challenges_overview;

-- Cleanup old games (keeps 5 most recent)
SELECT cleanup_dev_games();
```

## Brussels Venues Included

1. **Delirium Café** (4.7★) - Impasse de la Fidélité 4A
   - World-famous, 3000+ beer varieties
   
2. **À la Mort Subite** (4.3★) - Rue Montagne aux Herbes Potagères 7
   - Historic lambic specialist since 1928
   
3. **Brussels Beer Project** (4.5★) - Rue Antoine Dansaert 188
   - Modern craft brewery innovation
   
4. **Café du Sablon** (4.4★) - Rue de la Paille 4
   - Elegant Sablon district location
   
5. **Le Cirio** (4.2★) - Rue de la Bourse 18-20
   - Art Nouveau café from 1886
   
6. **Poechenellekelder** (4.3★) - Rue du Chêne 5
   - Puppet-themed near Manneken Pis
   
7. **Goupil le Fol** (4.1★) - Rue de la Violette 22
   - Medieval tavern atmosphere
   
8. **Au Bon Vieux Temps** (4.6★) - Impasse Saint-Nicolas 4
   - Hidden gem in narrow alley

## Challenge Categories

### Belgian Beer Knowledge (100-150 pts)
- Trappist brewery expertise
- Lambic fermentation processes
- Belgian beer history and styles
- ABV calculations and pairings

### Photo Challenges (90-180 pts)
- Brewery hunting and selfies
- Beer glass matching
- Team coordination photos
- Local landmark integration

### Cultural Engagement (110-160 pts)
- Local interactions and recommendations
- Brussels culture integration
- Traditional atmosphere capture

## Teams & Players

### Chicken Team
- **Name**: "Les Coqs de Bruxelles"
- **Player**: "Amélie" + random suffix
- **Role**: Host player, needs to hide

### Hunter Teams
1. **"Les Chasseurs de Manneken"** - Marie
2. **"Équipe Atomium"** - Pierre  
3. **"Brussels Detectives"** - Sophie
4. **"Les Gaufres Warriors"** - Jean-Baptiste

## Development Utilities

### Database Views

```sql
-- Overview of all games
SELECT * FROM dev_games_overview;

-- Challenge summary
SELECT * FROM dev_challenges_overview;
```

### Cleanup Function

```sql
-- Remove old test games (keeps 5 most recent)
SELECT cleanup_dev_games();
```

## Best Practices

### File Organization
- ✅ Migrations in `supabase/migrations/` with timestamp prefix
- ✅ Scripts in `scripts/` with executable permissions
- ✅ Documentation in `docs/` with clear naming
- ✅ SQL utilities as reusable functions

### Naming Conventions
- **Migrations**: `YYYYMMDDHHMMSS_descriptive_name.sql`
- **Scripts**: `kebab-case.js` with npm script aliases
- **Functions**: `snake_case()` for SQL functions
- **Views**: `dev_*` prefix for development utilities

### Safety Measures
- ✅ Idempotent operations (can run multiple times)
- ✅ Existence checks before creating duplicates
- ✅ Error handling and validation
- ✅ Environment variable verification
- ✅ Connection testing before operations

### Testing Integration
- ✅ Scripts can be called from tests
- ✅ Predictable data structure
- ✅ Easy cleanup and reset
- ✅ Isolated test environments

## Troubleshooting

### Common Issues

1. **Function doesn't exist**:
   ```bash
   # Apply the migration
   supabase db push
   ```

2. **Environment variables missing**:
   ```bash
   # Check .env file
   cat .env | grep SUPABASE
   ```

3. **Connection failed**:
   ```bash
   # Test Supabase connection
   supabase status
   ```

4. **Permission denied**:
   ```bash
   # Make script executable
   chmod +x scripts/create-brussels-game.js
   ```

### Debug Mode

Set `DEBUG=true` environment variable for verbose output:

```bash
DEBUG=true npm run create-brussels-game
```

## Integration with Tests

### Unit Tests
```javascript
import { createBrusselsGame } from '../scripts/create-brussels-game.js';

test('should create Brussels game', async () => {
  const game = await createBrusselsGame();
  expect(game.join_code).toMatch(/^BRUX[A-Z0-9]{2}$/);
});
```

### E2E Tests
```javascript
// Use created game for full workflow testing
const game = await createBrusselsGame();
await page.goto('/join');
await page.fill('[data-testid="join-code"]', game.join_code);
```

## Contributing

When adding new venues or challenges:

1. **Research**: Use real Brussels locations with accurate coordinates
2. **Cultural Accuracy**: Ensure Belgian beer culture authenticity  
3. **Test Data**: Include in both migration and script
4. **Documentation**: Update this guide with new content
5. **Validation**: Test with actual app functionality

## Related Files

- `CLAUDE.md` - Project context and memory bank
- `supabase/migrations/` - All database migrations
- `scripts/README.md` - General scripts documentation
- `docs/Database-Scripts-Guide.md` - Database management guide