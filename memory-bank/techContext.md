# Technical Context: The Chicken Chase

## 1. System Components
*   **Frontend Mobile App:**
    *   Framework: Ionic React
    *   Native Access: Capacitor (for Camera)
    *   Target: PWA with full offline support and native installation prompts
    *   Service Worker: Offline-first architecture with intelligent caching
*   **Backend:**
    *   Provider: Supabase
    *   Services: Database (PostgreSQL with RLS), Storage, Realtime, DB Functions.
    *   **Schema Management: Consolidated SQL Migration**.

## 2. Core Technologies & Libraries
*   **UI Framework:** Ionic React
*   **Supabase Client:** `@supabase/supabase-js` for all backend interactions.
*   **Native Bridge:** Capacitor (`@capacitor/camera`).
*   **Styling:** 
    *   Ionic UI components, Ionic CSS Utilities
    *   **Professional theming system:** Modular CSS architecture with design tokens
    *   **Responsive design:** Mobile-first approach with breakpoint system
    *   **Color palette:** Charcoal, Persian Green, Tangerine, Rose Quartz, Lavender Web
*   **Icons:** Ionicons.
*   **State Management:**
    *   React Hooks (`useState`, `useEffect`, `useCallback`) with strict Rules of Hooks compliance.
    *   **React Context (`SessionContext`)** for session state management.
    *   Custom hooks for encapsulating data logic (e.g., `useChickenGameState`, `usePlayerGameData`).
    *   **Critical Fix (2025-01-31):** `usePlayerGameData` restructured to prevent invalid hook calls.
*   **Data Fetching:** Direct calls to the Supabase client library and RPC functions.

## 3. Backend Architecture (Supabase)
*   **Authentication:** 
    *   **Graceful authentication system:** Works with or without Supabase authentication
    *   **Anonymous session model:** Player identity via localStorage and React Context
    *   **Optional auth enhancement:** Anonymous sign-ins for improved Realtime performance
*   **Database:** PostgreSQL. All schema changes are managed via a single consolidated SQL migration file.
*   **Database Functions:** We use plpgsql functions for atomic, transactional operations:
    *   `create_game_and_host`: Creates a game and host player with a unique join code
    *   `update_game_status`: Centralized function for game status updates, history tracking, and notifications
    *   `update_chicken_hidden_status`: Compatibility function that calls update_game_status
    *   **`update_my_presence` (2025-01-31):** Secure RPC function with `SECURITY DEFINER` to resolve RLS policy violations
*   **Game Configuration:** Extended schema with Wooclap-style parameters (max_teams, game_duration, started_at)
*   **Storage:** Supabase Storage is used for photo proofs.
*   **Realtime:** Supabase Realtime is used extensively for live updates:
    *   Game status changes via the `game_events` table
    *   Team and player updates
    *   Chat messages
*   **Row Level Security (RLS):** RLS is enabled and provides the primary security layer.

## 4. Key Code Patterns
*   **Centralized Supabase Client:** A single Supabase client instance in `src/lib/supabase.ts`.
*   **Component Decomposition:** Complex pages are broken down into smaller, focused components:
    *   `LobbyPage` uses `ImprovedLobbyView` and `WaitingRoomView`
    *   **Modern component architecture:** Modular, reusable, accessible components
*   **Centralized Types:** Global TypeScript types are defined in `src/types/types.ts`.
*   **Context-based Session:** The `useSession` hook provides access to session data (`playerId`, `gameId`) throughout the component tree.
*   **Centralized Status Management:** Game status changes are handled through the `update_game_status` SQL function.
*   **Real-time Notifications:** The `game_events` table is used for broadcasting status changes to all clients.
*   **Error Handling:** 
    *   Robust error handling for Supabase queries, avoiding `.single()`
    *   **Graceful authentication fallbacks:** Continue functionality when auth unavailable
    *   **Network resilience:** Retry mechanisms and manual refresh options
*   **Performance Optimization:**
    *   **Manual refresh system:** User-controlled updates replacing aggressive polling
    *   **Modular CSS architecture:** Token-based theming for consistent performance

## 5. Development Setup & Environment
*   **Local Development:** Standard Node.js/npm environment.
*   **Environment Variables:** `.env` file for Supabase URL and Anon Key.
*   **Version Control:** Git, including the `supabase/migrations` directory with consolidated migration file.

## 6. Technical Constraints & Considerations
*   **PWA Focus:** All development and testing prioritize the PWA experience.
*   **React 19 Compatibility:** Full compatibility maintained with Ionic React framework (verified 2025-01-31).
*   **Security:** RLS is the main line of defense. SQL functions that need broader access use `SECURITY DEFINER`.
*   **Code Quality:** Strict adherence to React Rules of Hooks to prevent invalid hook call errors.
*   **PWA Stability:** Defensive rendering patterns with loading states and error boundaries.
*   **Reproducibility:** The use of a consolidated SQL migration ensures that any developer can reliably set up the database schema.
*   **Data Consistency:** Centralized SQL functions ensure consistent data updates and proper event generation.

## 7. Infrastructure Requirements
*   Supabase Cloud project.
*   Hosting for PageCMS (if self-hosted or separate service).
*   (No Apple/Google developer accounts needed for PWA MVP). 