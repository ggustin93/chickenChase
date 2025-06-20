# Product Context: The Chicken Chase

## 1. Why This Project Exists
"The Chicken Chase" aims to modernize and streamline a popular real-world social game. The manual version can be cumbersome to organize, track, and ensure fairness. This project intends to:
*   Reduce organizational overhead for the game host.
*   Enhance the fun and competitive aspects through digital features.
*   Provide a centralized platform for all game-related activities and communication.
*   Introduce new gameplay elements (like structured challenges) not easily managed manually.

## 2. Problems It Solves
*   **Organizational Complexity:** Manual tracking of teams, scores, hidden locations, and rules can be challenging.
*   **Communication Gaps:** Difficulty in disseminating clues or updates effectively to all participants.
*   **Fairness and Transparency:** Ensuring consistent rule application and undisputed scoring.
*   **Engagement:** Keeping all players actively involved and informed throughout the game.
*   **Logistics of Hiding/Finding:** Streamlining the process of the "Chicken" hiding and teams reporting findings.
*   **Challenge Management:** Facilitating the introduction, tracking, and validation of mini-games or tasks.

## 3. How It Should Work (User Experience Goals)
*   **Simplicity and Intuition:** The app should be extremely easy to use, even for users who might be in a festive (and potentially less focused) state. Clear navigation, large tap targets, and minimal clutter are key.
*   **Fun and Engaging Theme:** A playful visual theme (chicken/farm related) and interactive elements (sounds, animations for key events) should enhance the enjoyment.
*   **Real-time Feedback:** Users should receive immediate confirmation for actions (e.g., visit logged, challenge submitted, score updated).
*   **Clear Communication:** Information like rules, game status, clues, and scores must be readily accessible and understandable.
*   **Role-Specific Interfaces:** Each role (Admin, Chicken, Hunter) should have a tailored interface showing only relevant information and actions.
*   **Reliability:** Core functionalities like GPS tracking, photo uploads, and real-time updates must be dependable.
*   **Battery Life Consideration:** Optimize native features like GPS to minimize battery drain during extended gameplay.

## 4. User Personas (from PRD)
*   **Admin/Organisateur:** The user who creates and configures the game. Needs tools for setup, parameter definition (zone, pot, teams, initial challenges), and sharing the game code.
*   **Poulet (Chicken):** The team (or individual) hiding. Needs tools to select a hiding spot, manage game progression (timer), validate challenge/visit submissions, communicate clues, log pot expenses, and confirm when found by Hunter teams.
*   **Chasseur (Hunter):** Teams searching for the Chicken. Need tools for map navigation, logging bar visits (GPS/photo), completing and submitting challenges, team chat, and viewing scores/leaderboard. They must also be aware of the social rule to consume at unsuccessfully visited bars.

## 5. Key User Flows (from PRD)
1.  **Admin Flow:** Create game (define zone, pot, teams, initial challenges) -> Share game code.
2.  **Player Authentication & Join:** All users authenticate (Magic Link) -> Join specific game session using code.
3.  **Chicken Flow:** Select initial bar -> Manage game (timer, validate submissions, send clues, log expenses) -> Confirm Hunter teams as they find them.
4.  **Hunter Flow:** Consult map/bar list -> Visit bars (social rule: consume if Chicken not there) -> Log visit (GPS/photo) -> Complete challenges -> Submit proofs -> Locate Chicken.
5.  **End of Game:** Occurs when all Hunter teams have found the Chicken. Display final leaderboard. Prize distribution is handled offline.

## 6. Ethical & UX Considerations (from PRD)
*   **Responsible Drinking:** Include messages of moderation. The app does not facilitate payments for alcohol for Hunters; this is their own expense.
*   **Data Privacy (RGPD):** Handle location and personal data responsibly, with clear consent and privacy policies. Purge sensitive data post-game.
*   **Clarity of Social Rules:** The app must clearly communicate the social rule that Hunters pay for their own drinks at bars where the Chicken is not found. The Chicken's pot is primarily for treating teams *after* they find the Chicken.
*   **Accessibility:** Design for usability, considering a dark mode for night use. 