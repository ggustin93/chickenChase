Excellent clarification! That "Wooclap-style" anonymous session model is a much better fit for a fun, spontaneous game like this. It dramatically lowers the barrier to entry—no one wants to create an account with a password just to play a game at a bar.

You're right to focus on making the next steps very clear and concrete. We're not trying to boil the ocean; we're building the first functional floor of our skyscraper.

Here is a more detailed and accurate 5-step plan that embraces the "no signup" model. I've broken down each step into smaller, more manageable tasks.

---

Awesome, thanks for the feedback. You've hit on a key insight: the user experience should be as frictionless as possible. Forcing signups is a major hurdle. The "Wooclap/Jackbox" model is perfect for us. Let's pivot our plan to that.

Here's the revised, more detailed roadmap. We'll build this piece by piece.

### The 5-Step Plan to a Live, "No Signup" Chicken Chase

- [x] **Action 1: Adjust the Backend for "Anonymous" Players**
    -   *Why we're doing this first:* Our database structure needs to support a game model where players are temporary participants, not permanent users. This changes how we think about "who" is doing what.

    - [x] **Revise Supabase Tables:**
        -   In your Supabase project, create these tables:
            -   `games`: to store game sessions. Add a `join_code` (e.g., a 6-character string) and a `status` column (e.g., 'lobby', 'active', 'finished').
            -   `teams`: to store team names. It should have a `game_id` to link it to a game.
            -   `players`: This is the key change. This table will store temporary player info. Give it columns like `id` (a unique UUID we'll generate on the device), `nickname`, `game_id`, and `team_id`. This table is *not* linked to Supabase's built-in `auth.users` table.
        -   Keep the other tables like `challenges`, `messages`, etc., but ensure they link to `game_id`, `team_id`, or `player_id` as needed.

    - [x] **Set up Initial Row Level Security (RLS):** Security is still important, even without logins. Let's set up some basic rules.
        -   On the `games` table: Allow anyone to `SELECT` a game if they know the `join_code`.
        -   On the `players` table: Allow anyone to `INSERT` a new player. For `SELECT` and `UPDATE`, you'll eventually want a rule like "a player can only update their own row," but we'll tackle that later. For now, focus on getting the join flow working.
        -   On the `teams` table: Allow anyone to `INSERT` a new team for a game, and `SELECT` all teams for a given game.

    - [x] **Keep Storage the Same:** The Storage bucket setup for photos is still good. We'll just associate uploaded photos with a `player_id` or `team_id` instead of a logged-in user ID.

    Details if needed :
    You're absolutely right to ask for more detail here and to bring up the `cagnotte`. A good database design is the bedrock of a good application, so let's get this right. Thinking about the "Wooclap-style" flow is also a fantastic simplification that makes the game much more accessible.

Let's design the Supabase schema from scratch, focusing on this anonymous, session-based model. I'll detail each table, its columns, and why we're setting it up that way.

Think of this as the architectural blueprint for our game's "brain."

---

### **Action 1 (Detailed): Designing and Building Our Supabase Backend**

**Goal:** Create a complete, logical, and secure database schema in Supabase that supports our anonymous game flow, including tracking the `cagnotte`.

Here is the step-by-step guide to creating each table in the Supabase Table Editor.

---

#### **Table 1: `games`**
*   **Purpose:** This is the master table for each game session. It holds the game's state and core settings.

| Column Name         | Data Type                   | Notes                                                                                                                              |
| ------------------- | --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `id`                | `uuid`                      | **Primary Key**. Default: `gen_random_uuid()`. This is the unique ID for the game.                                                     |
| `created_at`        | `timestamp with time zone`  | Default: `now()`. Automatically records when the game was created.                                                                   |
| `join_code`         | `varchar(6)`                | The 6-character code players will use to join (e.g., "AB7DE9"). We'll generate this on the client when creating a game.              |
| `status`            | `text`                      | Game state. Will be 'lobby', 'active', or 'finished'. Default: `'lobby'`.                                                          |
| `host_player_id`    | `uuid`                      | **Foreign Key** -> `players(id)`. The ID of the player who created the game, so only they can start it.                               |
| `chicken_team_id`   | `uuid`                      | **Foreign Key** -> `teams(id)`. The ID of the team designated as the "Chicken". Can be `NULL` until the game starts.                 |
| `cagnotte_initial`  | `integer`                   | The starting amount of the cagnotte. **Store this in cents** (e.g., 50.00€ is `5000`) to avoid floating-point errors.                  |
| `cagnotte_current`  | `integer`                   | The current amount in the cagnotte, also in cents. Default: same as `cagnotte_initial`.                                            |

---

#### **Table 2: `teams`**
*   **Purpose:** Stores the teams created within a specific game.

| Column Name           | Data Type | Notes                                                                                               |
| --------------------- | --------- | --------------------------------------------------------------------------------------------------- |
| `id`                  | `uuid`    | **Primary Key**. Default: `gen_random_uuid()`.                                                      |
| `game_id`             | `uuid`    | **Foreign Key** -> `games(id)`. **Required**. Links this team to a specific game. Set `ON DELETE CASCADE`. |
| `name`                | `text`    | The fun name of the team (e.g., "The Chickenators").                                                |
| `score`               | `integer` | Default: `0`. The team's current score.                                                             |
| `bars_visited`        | `integer` | Default: `0`. Counter for visited bars.                                                             |
| `challenges_completed`| `integer` | Default: `0`. Counter for completed challenges.                                                     |
| `found_chicken`       | `boolean` | Default: `false`. Becomes `true` when the team finds the chicken.                                     |

---

#### **Table 3: `players`**
*   **Purpose:** The key to our "no signup" flow. This table holds temporary player data for the duration of one game.

| Column Name | Data Type | Notes                                                                                                       |
| ----------- | --------- | ----------------------------------------------------------------------------------------------------------- |
| `id`        | `uuid`    | **Primary Key**. **NO default**. This ID is generated on the client-side (in the browser) and saved in `localStorage`. |
| `game_id`   | `uuid`    | **Foreign Key** -> `games(id)`. **Required**. Links the player to a game. Set `ON DELETE CASCADE`.             |
| `team_id`   | `uuid`    | **Foreign Key** -> `teams(id)`. Can be `NULL` if the player is in the lobby but hasn't joined a team yet.     |
| `nickname`  | `text`    | The player's chosen nickname.                                                                               |

---

#### **Table 4: `messages`**
*   **Purpose:** A log of all communications and important game events (the newsfeed).

| Column Name         | Data Type                  | Notes                                                                                                    |
| ------------------- | -------------------------- | -------------------------------------------------------------------------------------------------------- |
| `id`                | `bigint`                   | **Primary Key**. `Is Identity` should be checked to auto-increment.                                      |
| `created_at`        | `timestamp with time zone` | Default: `now()`.                                                                                        |
| `game_id`           | `uuid`                     | **Foreign Key** -> `games(id)`. **Required**. Set `ON DELETE CASCADE`.                                     |
| `player_id`         | `uuid`                     | **Foreign Key** -> `players(id)`. The player who sent the message. Can be `NULL` for system messages.      |
| `content`           | `text`                     | The message text.                                                                                        |
| `is_system_message` | `boolean`                  | Default: `false`. `true` for game events like "Team X found the chicken!".                               |

---

#### **Table 5: `challenges`**
*   **Purpose:** Stores the definitions of all available challenges. This can be pre-populated manually for an event.

| Column Name     | Data Type | Notes                                                                  |
| --------------- | --------- | ---------------------------------------------------------------------- |
| `id`            | `uuid`    | **Primary Key**. Default: `gen_random_uuid()`.                         |
| `title`         | `text`    | The title of the challenge.                                            |
| `description`   | `text`    | A longer explanation of what to do.                                    |
| `points`        | `integer` | How many points this challenge is worth.                               |
| `type`          | `text`    | 'photo' or 'unlock'.                                                   |
| `correct_answer`| `text`    | **Nullable**. The answer for 'unlock' type challenges. `NULL` for photo challenges. |

---

#### **Table 6: `challenge_submissions`**
*   **Purpose:** Tracks every time a team attempts a challenge.

| Column Name   | Data Type                  | Notes                                                                                     |
| ------------- | -------------------------- | ----------------------------------------------------------------------------------------- |
| `id`          | `uuid`                     | **Primary Key**. Default: `gen_random_uuid()`.                                          |
| `challenge_id`| `uuid`                     | **Foreign Key** -> `challenges(id)`. **Required**.                                        |
| `team_id`     | `uuid`                     | **Foreign Key** -> `teams(id)`. **Required**. The team that submitted.                      |
| `game_id`     | `uuid`                     | **Foreign Key** -> `games(id)`. **Required**. For easy filtering.                           |
| `status`      | `text`                     | 'pending', 'approved', 'rejected'. Default: `'pending'`.                                  |
| `photo_url`   | `text`                     | **Nullable**. URL to the proof photo in Supabase Storage.                                 |
| `submitted_at`| `timestamp with time zone` | Default: `now()`.                                                                         |

---

### **Putting It All Together: Your Action Plan in Supabase**

Here is your to-do list for setting this up in the Supabase Dashboard.

1.  **✅ Create `games` table:**
    *   Go to the "Table Editor" in Supabase.
    *   Click "New table".
    *   Name it `games`.
    *   Add all the columns exactly as defined above. For `id`, make sure it's a `uuid` and set the default to `gen_random_uuid()`.

2.  **✅ Create `teams`, `players`, and `challenges` tables:**
    *   Create these tables one by one. They don't have dependencies on each other yet, so the order doesn't matter.
    *   For `teams`, remember to add the `game_id` column now, but we'll make it a foreign key in the next step.

3.  **✅ Link Everything Together with Foreign Keys:**
    *   Go back to the `teams` table structure. Click "Add foreign key relation" on the `game_id` column and link it to the `public.games` table's `id` column. Set the "Action on delete" to `CASCADE`.
    *   Do the same for `players.game_id` -> `games.id`.
    *   Do the same for `players.team_id` -> `teams.id` (but make sure to allow `NULL` values for this one).
    *   Do the same for `games.host_player_id` -> `players.id`.
    *   Do the same for `games.chicken_team_id` -> `teams.id`.
    *   This visualizes the relationships and ensures data integrity.

4.  **✅ Create the "Join" tables:**
    *   Now create `messages` and `challenge_submissions`.
    *   Add all their foreign key relationships as you go (`game_id`, `player_id`, `team_id`, etc.).

5.  **✅ Manually Add Some Data for Testing:**
    *   Click on your `challenges` table and use the "Insert row" button to add 2-3 sample challenges.
    *   Do the same for `bars` if you decide to create a `bars` table for your city/event.

This detailed schema gives us a powerful yet flexible foundation. It fully supports the anonymous join flow and correctly tracks the `cagnotte` at the game level. Once this is set up, moving on to "Action 2: Create the 'Join Game' Flow" will be much, much easier because we'll have a clear destination for our data.

- [x] **Action 2: Create the "Join Game" Flow & Session Persistence**
    -   *Why we're doing this:* This replaces the entire concept of login/signup. It's the new front door to our app and needs to be smooth. We also need to make sure a player who accidentally closes their browser can get back into the game.

    - [x] **Build the `HomePage`:** Update `src/pages/Home.tsx` to have two main buttons: "Create Game" and "Join Game".
    - [x] **Build the `JoinGamePage`:** When a user clicks "Join Game," take them to a new page with two simple inputs: one for the 6-character `join_code` and one for their `nickname`.
    - [x] **Implement the "Join" Logic:** When they submit the form:
        1.  **Generate a Player ID:** Create a unique ID for the player right in the browser. A simple way is `crypto.randomUUID()`.
        2.  **Save to `localStorage`:** This is the core of our session persistence. Store an object like `{ playerId: '...', gameId: '...', nickname: '...' }` in the browser's `localStorage`.
        3.  **Create the Player in Supabase:** Send the generated `playerId`, `nickname`, and the `gameId` (which you get by looking up the `join_code`) to your Supabase `players` table.
        4.  **Navigate to the Lobby:** Redirect the user to the `LobbyPage` for that game.
    - [x] **Implement Reconnection:** In your main `App.tsx`, add a `useEffect` hook that runs on startup. It should check `localStorage` for a `playerId` and `gameId`. If it finds them, it should automatically navigate the user back to that game's lobby or main screen, effectively "logging them back in."

- [x] **Action 3: Build the Game Lobby and Team Selection**
    -   *Why we're doing this:* The lobby is the social hub before the chaos begins. It's where players see who's here and form their squads. Getting the real-time updates right here is a huge win.

    - [x] **Create `LobbyPage.tsx`:** This page takes a `gameId` from the URL.
    - [x] **Display Players & Teams in Realtime:**
        -   Fetch all players and teams associated with the `gameId`.
        -   Use Supabase Realtime to subscribe to the `players` and `teams` tables for that game.
        -   When a new player joins, their nickname should pop into the list for everyone in the lobby *without* them needing to refresh the page.
    - [x] **Implement Team UI:**
        -   Show a list of teams that already exist for that game.
        -   Display the members of each team and how many spots are left (e.g., "Chicken Run (2/4)").
        -   Add a "Join" button next to each team that isn't full.
        -   Add a "Create New Team" button.
    - [x] **Implement Team Logic:**
        -   Clicking "Join Team" updates the `team_id` for that player in the `players` table. This change should appear instantly for everyone.
        -   Clicking "Create Team" adds a new row to the `teams` table and updates the player's `team_id`.
    - [x] **Add "Start Game" Button:** This button is only visible to the first player who created the game (the "host"). When clicked, it updates the game's `status` in the `games` table from 'lobby' to 'active', which will then navigate all players to the main game interface.
    - [x] **Corriger le problème de redirection:** 
        -   Assurer que le champ `chicken_team_id` dans la table `games` est correctement mis à jour lorsqu'une équipe Chicken est créée ou rejointe.
        -   Améliorer la gestion des erreurs dans les requêtes Supabase en évitant d'utiliser `.single()` qui échoue si aucune ligne n'est retournée.
        -   Vérifier l'existence de la partie avant de tenter de mettre à jour son statut.

- [x] **Action 4: Wire Up a Single Page (`PlayerPage`) with Live Data**
    -   *Why we're doing this:* It's time to connect our beautiful, already-built UI to our live backend. We'll focus on just the `PlayerPage` to prove the concept from end to end.

    - [x] **Create a `usePlayerGameData` Hook:** This hook will be the heart of the `PlayerPage`. It will take `gameId` and `teamId` as arguments.
    - [x] **Fetch Core Data:** Inside this new hook, fetch the essential data from Supabase:
        -   The list of all bars for the game.
        -   The list of all challenges.
        -   The player's team information (score, members).
        -   The list of bars the player's team has *already visited* (this will be a new table, e.g., `bar_visits`).
    - [x] **Connect the `MapTab`:**
        -   In `src/components/player/MapTab.tsx`, replace the mock `bars` and `visitedBars` props with the live data from your hook.
        -   The map should now display all the bars. A bar should look different if its `id` is in the `visitedBars` list.
    - [x] **Connect the `ChallengesTab`:**
        -   In `src/components/player/ChallengesTab.tsx`, feed it the live list of `challenges` from your hook.
        -   The status of each challenge (e.g., 'approved', 'pending') will come from a `challenge_submissions` table.

- [x] **Action 5: Implement One Core Game Action: Submitting a Challenge**
    -   *Why we're doing this:* This is the final step to prove our entire loop works. A player performs an action, it's saved to the database, and the UI reflects the new state. It's the most satisfying step!

    - [x] **Focus on the `ChallengesTab`:** When a player clicks on a challenge to complete it, the `onViewChallengeDetail` handler is called.
    - [x] **Handle Photo Proof:**
        1.  Open the `CameraModal` as you do now.
        2.  After the photo is taken, `handlePhotoProofSubmit` is called.
        3.  **Upload the Photo:** Inside this function, upload the photo file to your Supabase Storage bucket. The path should be something like `challenge_proofs/{game_id}/{team_id}/{challenge_id}.jpg`.
        4.  **Create a Submission Record:** After the upload is successful, get the public URL of the photo. Then, insert a new row into a `challenge_submissions` table. This row should include the `challenge_id`, `team_id`, the `photo_url`, and a `status` of 'pending'.
    - [x] **Update the Chicken's UI:** Now, switch to the `ChickenPage`. The `ChallengesTabContent` for the chicken should be listening to the `challenge_submissions` table. When the new submission is inserted, it should appear in the "Pending" list for the chicken to validate.

Completing these five steps will give you a fully functional, real-time game core. It's a significant amount of work, but breaking it down like this makes it much more approachable. We can build and test each piece before moving to the next.

Let's start with Action 1. How does that sound?

---

### **Phase 2: Building the Game Management Core**

*With the player-facing flow complete, Phase 2 focuses on giving the game host the tools to manage the game and on making the player experience fully live.*

- [ ] **Action 6: Build the Host's Challenge Validation UI**
    -   *Why we're doing this:* The game is currently unmanageable after it starts. The host needs to be able to approve or reject submissions to make the game playable.

    - [ ] **Create a `HostPage`:** This page will be accessible only to the player whose ID matches the `host_player_id` in the `games` table. We'll need a new route and a way to conditionally navigate to it.
    - [ ] **Create a `useHostData` Hook:** Similar to the player's hook, this will fetch all `challenge_submissions` with a 'pending' status for the current game. It should also subscribe to real-time inserts on that table.
    - [ ] **Build the Validation List:** The `HostPage` will display a list of pending submissions. Each item should show:
        -   The challenge title.
        -   The submitting team's name.
        -   The submitted photo (if any).
        -   The submitted text answer (if any).
        -   "Approve" and "Reject" buttons.

- [ ] **Action 7: Implement the Validation and Scoring Logic**
    -   *Why we're doing this:* This closes the loop. A host's action must have a direct and immediate impact on the game state, specifically the team's score.

    - [ ] **Implement "Approve/Reject" Handlers:**
        -   Create functions that are called when the host clicks the buttons.