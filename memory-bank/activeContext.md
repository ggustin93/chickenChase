# Active Context: The Chicken Chase

## 1. Current Work Focus
*   **Completing the Player Experience:** The immediate priority is to finish wiring up the `PlayerPage.tsx` with live data. While challenges are connected, the Map, Chat, and Leaderboard tabs still use mock data.
*   **Building the Host/Chicken UI:** The game is currently unmanageable after it starts. We need to build the interface for the game host (the "Chicken") to validate pending challenge submissions.

## 2. Recent Changes & Decisions
*   **Architectural Pivot to "No Signup" Model:** The entire application was refactored to support an anonymous, session-based flow using `localStorage` persistence. The previous user-account model was removed.
*   **Streamlined Game Creation:** The `HomePage` was redesigned. It now lists active lobbies and features a one-click "Create Game" button, completely removing the need for a separate, complex admin page.
*   **Backend & Core Logic Implemented:**
    *   The Supabase database schema was rebuilt from scratch to support the new anonymous flow.
    *   A real-time lobby with team creation/joining is fully functional.
    *   A `usePlayerGameData` hook was created to manage live game data for players.
    *   The challenge submission flow (both photo and unlock types) is live and connected to the backend.

## 3. Next Steps (Immediate)
1.  **Build the Host Challenge Validation UI:**
    *   Create a new page or component for the host.
    *   This UI must fetch and display all submissions from the `challenge_submissions` table with a `pending` status for the current game.
    *   It needs "Approve" and "Reject" buttons for each submission.
2.  **Implement the Validation Logic:**
    *   Clicking "Approve" should update the submission's `status` to 'approved' and, critically, trigger an update to the corresponding team's score in the `teams` table.
    *   Clicking "Reject" should update the `status` to 'rejected'.
3.  **Complete `PlayerPage` Live Data Integration:**
    *   Connect the `LeaderboardTab` to the `teams` table to show a live scoreboard.
    *   Connect the `ChatTab` to the `messages` table using Supabase Realtime.
    *   (Optional for now) Connect the `MapTab` to a `bars` table if we decide to implement that feature.

## 4. Active Decisions & Considerations
*   **Host/Chicken Role:** How does a player become the host/chicken? Currently, the first player to create a game is the host. We need to decide if we want a more explicit role-selection step or if this implicit assignment is sufficient for the MVP.
*   **Refactoring `PlayerPage.tsx`:** This component is still very large and holds a lot of state and logic related to the old mock data. As we connect more live features, we should progressively refactor it, moving logic into custom hooks and breaking the UI into smaller components.
*   **Scoring Logic:** We need to implement the actual score update logic. This will likely be a Supabase Edge Function that is triggered when a challenge submission is approved, ensuring the logic is secure and centralized.

## 5. Important Patterns & Preferences (Emerging)
*   **Real-time First:** The application relies heavily on Supabase Realtime for a live, interactive experience. New features should follow this pattern.
*   **Custom Hooks for Data Fetching:** The `usePlayerGameData` hook is a good pattern. We should create similar hooks for other data-heavy components (like the upcoming Host UI).
*   **Client-Side Session Management:** The use of `crypto.randomUUID()` for player IDs and `localStorage` for session storage is the core of our auth-less system.

## 6. Learnings & Project Insights
*   Pivoting to a simpler user flow, even if it requires significant refactoring, is worth it for user experience. The "no signup" model is a huge win.
*   A clean, logical database schema makes frontend development much faster. The time spent designing the tables in `todo.md` paid off.
*   The core gameplay loop is now tangible. We can play a basic version of the game, which is a massive milestone and will make it easier to identify the most important features to build next. 