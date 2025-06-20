# Project Brief: The Chicken Chase

## 1. Project Overview
"The Chicken Chase" is a social party game designed for groups of friends, aiming to digitize and enhance an existing real-world game experience. The core concept involves a "Chicken" team hiding in a bar within a defined play area, funded by a common pot they use to treat "Hunter" teams that find them. Hunter teams search for the Chicken, with a social rule requiring them to consume at each unsuccessfully visited bar (at their own expense). The mobile application will streamline organization, add gamification (challenges, scoring), and facilitate communication.

## 2. Core Goals
*   **Digitize and Enhance:** Transform the manual game into a user-friendly mobile experience.
*   **Simplify Organization:** Automate game setup, role assignment, and tracking.
*   **Increase Engagement:** Introduce challenges, real-time scoring, and dynamic communication.
*   **Facilitate Communication:** Provide in-app chat and notification features.
*   **Fair Play:** Ensure transparent rules and scoring.

## 3. Target Audience
Young adults (18-35 years old) who are sociable, enjoy group activities and bar outings, and are comfortable using mobile applications.

## 4. Scope (MVP - Phase 1 from PRD)
*   **Core Gameplay Loop:**
    *   User Authentication (Magic Link via email).
    *   Game creation by Admin (zone, initial pot, max teams/participants, initial challenges).
    *   Players join via unique game code.
    *   Random assignment of "Chicken" role.
    *   Chicken selects hiding bar.
    *   Hunters visit bars (GPS/photo validation).
    *   Chicken validates photo-based visits.
    *   Basic scoring (order of finding, challenge completion).
    *   Game ends when all Hunters find the Chicken.
*   **Key Features (MVP):**
    *   Admin interface for game setup.
    *   Chicken interface (select bar, validate submissions, manage pot spending, send clues, confirm found teams).
    *   Hunter interface (map navigation, log visits, submit challenge proofs, team chat).
    *   Centralized communication (global chat, Chicken-to-all clues).
    *   Dynamic scoring and leaderboard.
*   **Technical Stack (MVP):**
    *   Frontend: Ionic React (PWA).
    *   Backend: Supabase (Auth, DB, Storage, Realtime, Edge Functions).
    *   CMS: PageCMS (for challenges).
    *   Native Access (Capacitor): GPS, Camera.

## 5. Non-Goals for MVP
*   Monetization features.
*   Advanced social features (friend systems, detailed profiles).
*   Offline mode capabilities beyond basic caching.
*   Integration with payment systems for the pot.
*   Bar partnership program (marked as optional/extension in PRD).
*   Push notifications (basic implementation in Phase 2).
*   Multiple themes or advanced customization.
*   No native app builds (PWA only for MVP).

## 6. Success Metrics (Conceptual)
*   Number of games created and played.
*   User engagement (time spent in app, challenges completed).
*   Positive user feedback on ease of organization and fun factor.
*   Successful completion of game loops. 