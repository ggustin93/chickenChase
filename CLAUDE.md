# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Plan & Review

### Before Starting Work

- Always plan mode first, write plan to `.claude/tasks/TASK_NAME.md`
- Plan should include: implementation strategy, broken-down tasks, dependencies
- Research external knowledge/packages if needed (use Context7 MCP or other tools)
- Available MCPs: Supabase, Context7, Puppeteer, Shadcn/ui
- Think MVP first
- Get plan approval before continuing
- Ask: "Want git control point?" If BIG PLAN & yes: "New branch?"

### Git Control Points (if enabled)

- Feature branch: `git checkout -b feature/TASK_NAME`
- Atomic commits: `feat:`, `fix:`, `docs:` + reference plan

### While Implementing

- Update plan as you work: `- [x] Done` / `- [ ] Todo`
- Document changes and reasoning for future engineers (detailed descriptions for handoff)
- Test each task, build project/run lint before marking complete
- Get approval for significant scope changes

### After Implementation

- Perform MVP critical (no need for comprehensive) testing of the implementation. Document them in .claude/TESTS/TEST_NAME.md 
- Review against original plan
- Update project docs
- Archive completed plan

### Known Issues & Solutions

1. **Chicken team assignment** - Must be set before game can start
2. **Real-time updates** - Requires proper RLS policies and JWT claims
3. **Session persistence** - Uses localStorage, cleared on logout

## MCP Servers Configuration

✅ **Configured and Active**:
- **Context7** - Documentation lookup (`claude mcp list` to verify)
- **Puppeteer** - Browser automation & E2E testing
- **Perplexity** - AI-powered web search
- **Supabase** - Database operations with access token

📖 **Setup Guide**: See [docs/MCP-Setup-Guide.md](./docs/MCP-Setup-Guide.md) for complete configuration instructions.

## Development Commands

### Running the Application
```bash
npm run dev     # Start development server with Vite
npm run start   # Alternative: Start with Ionic serve
```

### Building and Testing
```bash
npm run build     # TypeScript check and production build
npm run test.unit # Run unit tests with Vitest
npm run test.e2e  # Run E2E tests with Cypress
npm run lint      # Run ESLint
```

### Development Tools
```bash
npm run list       # List available development scripts
npm run generate   # Generate code/components
npm run parse-prd  # Parse the product requirements document
```

## Project Architecture

### Technology Stack
- **Frontend**: Ionic React PWA with Capacitor for native features
- **Backend**: Supabase (PostgreSQL, Authentication, Realtime, Storage)
- **Styling**: Tailwind CSS + Ionic Components
- **Build Tool**: Vite
- **Testing**: Vitest (unit) + Cypress (E2E)

### Core Game Flow
1. **Home** → User creates or joins a game
2. **JoinGame** → Enter join code and nickname (no auth required)
3. **Lobby** → Team formation, wait for game start
4. **Game Pages**:
   - **ChickenPage** (`/chicken/:gameId`) - Chicken team interface
   - **PlayerPage** (`/player/:gameId`) - Hunter teams interface

### Key Database Tables

1. **games** - Master table for game sessions
   - `status`: lobby → in_progress → chicken_hidden → finished
   - `chicken_team_id`: Must be set before starting game
   - `cagnotte_initial/current`: Stored in cents

2. **teams** - Teams within a game
   - `is_chicken_team`: Differentiates Chicken from Hunter teams
   - `score`, `bars_visited`, `challenges_completed`

3. **players** - Temporary player sessions
   - No auth required - uses localStorage for session persistence
   - Links to team and game

4. **game_events** - Real-time notification system
   - `event_type` + `event_data` (JSON) for flexible events
   - Published via Supabase Realtime

5. **game_status_history** - Audit trail for all status changes

### Critical SQL Functions

- **`update_game_status(game_id, new_status)`** - Centralized status management
  - Validates transitions, updates history, creates events
  - Checks `chicken_team_id` before allowing game start

- **`create_game_and_host(nickname)`** - Creates game + host player
  - Generates unique 6-char join code
  - Returns game_id, player_id, join_code

### Session Management Pattern

The app uses a "Wooclap-style" anonymous session model:
```typescript
// Session stored in localStorage
{
  playerId: uuid,
  gameId: uuid, 
  nickname: string,
  teamId?: uuid,
  isChickenTeam?: boolean
}
```

Auto-reconnection logic in `App.tsx` redirects users back to their game on refresh.

### Real-time Updates

All real-time updates use Supabase Realtime with proper RLS policies:
```typescript
// Example subscription pattern
supabase
  .channel(`game-${gameId}`)
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'players',
    filter: `game_id=eq.${gameId}`
  }, handleUpdate)
  .subscribe()
```

### Error Handling Patterns

1. **Avoid `.single()`** - It throws if no rows found
2. **Check data existence** before updates
3. **Use RPC functions** for critical operations
4. **Handle arrays properly**:
```typescript
// Good pattern
const { data, error } = await supabase.from('games').select('*').eq('id', gameId);
if (data && data.length > 0) {
  const game = data[0];
  // Process...
}
```

### Component Organization

- **Pages**: Main route components (`/src/pages/`)
- **Components**: Reusable UI components
  - `/admin/` - Admin-specific components
  - `/chicken/` - Chicken team components
  - `/player/` - Hunter team components
  - `/shared/` - Shared across roles
- **Hooks**: Custom React hooks (`/src/hooks/`)
- **Contexts**: Global state management (`/src/contexts/`)

### Current Focus Areas

1. **Real-time reliability** - Ensuring all players see updates instantly
2. **Game state synchronization** - Proper status transitions and redirects
3. **Error resilience** - Graceful handling of network/data issues
4. **Mobile optimization** - PWA performance on mobile devices

### Environment Variables

Required in `.env`:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

