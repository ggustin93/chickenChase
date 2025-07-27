# Database Scripts Guide

This guide explains how to use the comprehensive database scripts for the Chicken Chase application.

## 📁 Available Scripts

### 1. Complete Schema Setup
**File**: `supabase/migrations/20250621000000_complete_schema_setup.sql`

**Purpose**: Creates the complete database schema from scratch with all tables, constraints, functions, and RLS policies.

**What it does**:
- 🧹 Removes all existing tables and functions (clean slate)
- 🏗️ Creates all tables with proper relationships and constraints
- 🔐 Sets up Row Level Security (RLS) policies
- ⚡ Adds performance indexes
- 🔧 Creates database functions for game management
- 📡 Enables Supabase Realtime subscriptions

**Tables created**:
- `games` - Main game sessions
- `challenges` - Available challenges (20 rich challenges included)
- `game_bars` - Bars specific to each game
- `teams` - Teams within games
- `players` - Players in games
- `messages` - In-game chat
- `challenge_submissions` - Challenge completions
- `game_events` - Real-time events
- `game_status_history` - Audit trail

### 2. Test Data Seeding
**File**: `supabase/migrations/test_data_seed.sql`

**Purpose**: Populates the database with realistic test data for development and testing.

**What it creates**:
- 🏆 **20 Rich Challenges**: Social, tourist, creative, and riddle challenges
- 🎮 **3 Test Games**:
  - `TEST01` - Active game with chicken hidden (test gameplay)
  - `LOBBY2` - Lobby waiting for players (test joining)
  - `FINISH` - Completed game (test statistics)
- 👥 **Multiple Teams and Players** in different states
- 🍺 **Brussels Bars** with realistic locations and data
- 💬 **Chat Messages** showing game progression
- 📊 **Challenge Submissions** with various statuses
- ⚡ **Game Events** for real-time testing

### 3. Reset and Seed (Complete Reset)
**File**: `supabase/migrations/reset_and_seed.sql`

**Purpose**: One-click script to completely reset and populate the database.

**Usage**:
```sql
-- In Supabase SQL Editor, run this script
\i supabase/migrations/reset_and_seed.sql
```

**Perfect for**:
- 🚀 Initial development setup
- 🧪 Fresh testing environment
- 🔄 Complete database refresh

### 4. Clean Data Only
**File**: `supabase/migrations/clean_data_only.sql`

**Purpose**: Removes all data while keeping the schema structure intact.

**Usage**:
```sql
-- In Supabase SQL Editor
\i supabase/migrations/clean_data_only.sql
```

**Perfect for**:
- 🧹 Cleaning test data without recreating schema
- 🔄 Quick data refresh during development
- 🧪 Preparing for new test scenarios

## 🚀 Quick Start Guide

### For Development Setup:
1. **Complete Reset**: Run `reset_and_seed.sql`
2. **Start Developing**: You now have 3 test games ready to use
3. **Test Different Scenarios**: Use the join codes `TEST01`, `LOBBY2`, `FINISH`

### For Testing:
1. **Clean Data**: Run `clean_data_only.sql`
2. **Add Fresh Test Data**: Run `test_data_seed.sql`
3. **Test Features**: Use the populated test games

### For Production Deployment:
1. **Schema Only**: Run `20250621000000_complete_schema_setup.sql`
2. **Initialize Challenges**: Use the app's challenge initialization feature
3. **Ready for Real Users**: Schema is production-ready

## 🎮 Test Game Scenarios

### Game: `TEST01` (Active Gameplay)
- **Status**: `chicken_hidden` (game in progress)
- **Teams**: Chicken team hidden, 2 hunter teams actively searching
- **Bars**: 6 Brussels bars, some already visited
- **Challenges**: Multiple completed submissions
- **Perfect for testing**: 
  - Map functionality
  - Real-time updates
  - Challenge submissions
  - Bar visits

### Game: `LOBBY2` (Joining Process)
- **Status**: `lobby` (waiting for players)
- **Teams**: 2 teams formed, waiting for more players
- **Perfect for testing**:
  - Game joining flow
  - Team formation
  - Lobby functionality

### Game: `FINISH` (Statistics/History)
- **Status**: `finished` (completed game)
- **Teams**: Winner determined, full game statistics
- **Perfect for testing**:
  - Game results display
  - Statistics calculation
  - Historical data

## 🛠️ Database Functions Available

### Game Management
- `create_game_and_host(nickname, cagnotte, max_teams, duration)` - Create new game
- `update_game_status(game_id, new_status)` - Change game status
- `update_chicken_hidden_status(game_id)` - Mark chicken as hidden

### Bar Management
- `import_bars_to_game(game_id, bars_json)` - Import bars to a game
- `mark_bar_as_visited(game_id, bar_id, team_id)` - Mark bar as visited

## 🔐 Security Features

- **Row Level Security (RLS)** enabled on all tables
- **Public read access** for games and challenges (for joining)
- **Authenticated access** for sensitive operations
- **Team-based access control** for game data
- **Host privileges** for game management

## 📊 Performance Optimizations

- **Indexes** on frequently queried columns
- **Efficient foreign key relationships**
- **Optimized query patterns**
- **Realtime subscriptions** configured for live updates

## 🧪 Development Workflow

1. **Start Fresh**: `reset_and_seed.sql`
2. **Develop Features**: Use test games to verify functionality
3. **Test Changes**: `clean_data_only.sql` → `test_data_seed.sql`
4. **Repeat**: Clean cycle for consistent testing

## 📝 Notes

- All scripts are **idempotent** - safe to run multiple times
- **UTF-8 encoding** for proper character support
- **Brussels-focused** test data with real locations
- **Realistic game scenarios** for comprehensive testing
- **Production-ready** schema suitable for deployment

These scripts provide a complete database management solution for the Chicken Chase application, from development to production deployment! 🎉