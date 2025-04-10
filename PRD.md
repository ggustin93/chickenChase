# Spécifications - The Chicken Chase

## Overview
"The Chicken Chase" est un jeu social festif destiné à des groupes d'amis. L'objectif est de digitaliser et d'améliorer l'expérience de ce jeu existant via une application mobile. Un binôme désigné (le "poulet"), financé par une cagnotte commune, se cache dans un bar défini dans une zone de jeu. Les autres participants, en équipes, doivent le retrouver. Chaque bar visité sans succès impose une consommation. La dernière équipe à trouver le poulet offre une tournée générale. L'application vise à simplifier l'organisation, ajouter une dimension ludique (défis, scoring) et faciliter la communication, rendant le jeu plus engageant et accessible. Elle cible les jeunes adultes (majeurs, en raison de la consommation d'alcool) cherchant des activités de groupe originales et interactives.

## Core Features

### 1. Configuration et Lancement de Partie
*   **What it does:** Permet aux utilisateurs de créer une nouvelle partie, d'en définir les paramètres (zone géographique sur carte interactive, montant/gestion cagnotte, heure limite, nombre de participants/équipes) et d'inviter des joueurs. Gère l'attribution aléatoire du rôle "poulet".
*   **Why it's important:** Simplifie l'organisation fastidieuse du jeu, assure l'équité (tirage au sort) et centralise les informations de la partie.
*   **How it works:** Formulaire de création, intégration carte (Mapbox/Leaflet via Capacitor), système d'invitation (lien partageable, SMS, QR code), algorithme de tirage au sort, potentielle intégration paiement simple ou suivi manuel des contributions.

### 2. Interface "Poulet"
*   **What it does:** Fournit au binôme "poulet" les outils pour gérer sa partie : sélection du bar initial sur la carte, chronomètre pour l'avance, validation des défis des équipes, communication (chat, indices), visualisation des photos des équipes.
*   **Why it's important:** Donne au poulet un rôle actif et central dans le jeu, au-delà de simplement se cacher.
*   **How it works:** Interface dédiée avec carte filtrée sur la zone de jeu, timer visuel, flux de validation de défis (preuves photo), interface de chat dédiée, galerie photos reçues.

### 3. Interface "Équipes de Recherche"
*   **What it does:** Équipe les chasseurs avec une carte de la zone, l'historique de leurs bars visités, la liste des défis à réaliser, un outil de capture photo géolocalisée pour preuves, un chat d'équipe et un système de marquage des bars visités. Affiche le compteur de bars visités.
*   **Why it's important:** Fournit tous les outils nécessaires à la recherche, à la complétion des défis et à la compétition entre équipes.
*   **How it works:** Interface avec carte interactive, liste de défis cochables, intégration caméra native (Capacitor), système de chat par équipe, couche de données locale pour marquer les bars, compteur visible incrémenté à chaque validation de bar.

### 4. Communication Centralisée
*   **What it does:** Intègre différents canaux de communication : chat global (tous les participants), chat privé (poulet/admin), diffusion d'indices par le poulet, notifications push pour événements clés.
*   **Why it's important:** Facilite l'interaction, maintient l'engagement et informe les joueurs en temps réel.
*   **How it works:** Utilisation des Realtime Features de Supabase pour les chats, Supabase Functions pour la logique de diffusion d'indices et l'envoi de notifications push (via intégration service push).

### 5. Scoring et Classement
*   **What it does:** Calcule les scores en temps réel (points par bar visité, points bonus pour défis, malus pour la dernière équipe), affiche un classement dynamique, et conserve un historique des parties. Met en avant le nombre de bars visités par équipe.
*   **Why it's important:** Ajoute un élément compétitif et ludique, motive les équipes et permet de suivre la progression.
*   **How it works:** Logique de scoring définie (potentiellement via Supabase Functions), mise à jour de la base de données en temps réel, interface de classement mise à jour via subscriptions Supabase, stockage des résultats de partie.

### 6. Intégration Bars Partenaires (Optionnel/Extension)
*   **What it does:** Permet aux bars de devenir partenaires, offrant potentiellement des avantages aux joueurs et une visibilité accrue aux bars. Inclut un formulaire d'inscription pour les bars et une signalétique spéciale sur la carte du jeu.
*   **Why it's important:** Peut créer un écosystème autour du jeu et potentiellement une source de revenus/partenariats.
*   **How it works:** Section dédiée dans l'app (ou formulaire web externe via QR code) pour la soumission d'informations par les gérants, stockage des données des bars partenaires dans Supabase, affichage différencié sur la carte.

## User Experience (UX)
*   **User Personas:** Jeunes adultes (18-35 ans), sociables, appréciant les jeux de groupe et les sorties en bar, à l'aise avec les applications mobiles. Inclure persona "Organisateur", "Poulet", "Chasseur".
*   **Key User Flows:**
    1.  Création/Rejoindre une partie.
    2.  Flux du Poulet: Démarrage, sélection bar, attente, validation défis, envoi indices.
    3.  Flux Chasseur: Consultation carte, déplacement bar, validation bar (photo), réalisation défi, consultation classement, communication équipe.
    4.  Fin de partie: Identification dernière équipe, affichage résultats.
*   **UI/UX Considerations:**
    *   Interface très simple, utilisable facilement même en état d'ébriété (gros boutons, navigation claire).
    *   Thème graphique ludique et reconnaissable (poulet/ferme).
    *   Mode sombre indispensable pour usage nocturne.
    *   Feedback clair : sons et animations pour actions clés (validation défi, trouvaille poulet, etc.).
    *   Optimisation pour l'autonomie (gestion fréquence GPS).
    *   Avatars/Noms d'équipes personnalisables.

## Technical Architecture
*   **System Components:**
    *   Frontend Mobile App: Ionic React (UI), Capacitor (Native Access - GPS, Camera, Push). PWA uniquement, pas de build natif.
    *   Backend: Supabase (Auth, Database - PostgreSQL, Storage, Realtime, Edge Functions).
    *   CMS: PageCMS (Gestion contenu dynamique - Défis, Règles).
*   **Data Models (Supabase - PostgreSQL):**
    *   `games`: id, settings (jsonb: zone_coords, time_limit, etc.), status, chicken_team_id, created_at.
    *   `teams`: id, game_id, user_ids (array), name, avatar_url, score, bars_visited_count.
    *   `users`: id (Supabase Auth), profile_info (jsonb).
    *   `participants`: user_id, game_id, team_id, role (chicken/hunter).
    *   `visits`: id, team_id, game_id, bar_name, location (PostGIS point), photo_url, timestamp.
    *   `challenges`: id, game_id, team_id, challenge_def_id (from CMS), status, proof_photo_url.
    *   `messages`: id, game_id, user_id, team_id (nullable), content, timestamp.
    *   `partner_bars` (Optionnel): id, name, address, coords, description, logo_url, offers (jsonb).
*   **APIs and Integrations:**
    *   Supabase REST/GraphQL API pour interactions DB/Auth/Storage.
    *   Supabase Realtime pour chat et mises à jour live.
    *   Supabase Edge Functions pour logique métier (scoring, tirage au sort, notifications, purge photos).
    *   PageCMS API pour récupérer défis, règles.
    *   Services de cartographie (ex: Mapbox, OpenStreetMap) via Capacitor Geolocation et librairie de carte JS (Leaflet).
    *   Service d'envoi de SMS (ex: Twilio) si OTP SMS est implémenté.
    *   Services Push Notifications (APNS/FCM) via Capacitor Push Notifications.
*   **Infrastructure Requirements:**
    *   Supabase Cloud project.
    *   PageCMS hosting.
    *   Comptes développeur Apple/Google pour publication store.

*   **Technical Specifics:** (Synthèse des points de l'ancien PRD)
    *   **UI/Styling:** Ionic React, Ionicons/Lucide React, variables CSS Ionic pour theming modulable (tokens design), séparation structure/style.
    *   **Media Management:** Upload via Supabase Storage, compression/redimensionnement client avant upload (ex: `browser-image-compression`), limites taille/nombre, purge automatique via Supabase Function (cron).
    *   **Authentication:** Supabase Auth (Magic Link, OTP SMS optionnel, OAuth Google/Apple), gestion invitations (codes/liens).
    *   **CMS Integration:** Modèles PageCMS (Défis, Règles, Messages système).
    *   **Performance/Offline:** Ajustement fréquence GPS, cache données carte, lazy loading, synchronisation optimisée.

## Development Roadmap
*   **Phase 1: MVP Core Gameplay**
    *   Infrastructure Supabase (Auth, DB tables essentielles, Storage).
    *   Utilisation et correction des maquettes existantes (ChickenPage.tsx et HunterTeamPage.tsx) pour Ionic React (écrans principaux: accueil, création partie, carte jeu, interface poulet/chasseur basique).
    *   Fonctionnalités de base: Création partie, invitation simple (lien), tirage poulet, sélection bar (poulet), visite bar (chasseur avec photo), chat global simple, classement basique (sans points).
    *   Accès natif: Géolocalisation, Caméra.
    *   Déploiement test interne (PWA uniquement, pas de TestFlight/Internal Testing).
*   **Phase 2: Enhanced Gameplay & UX**
    *   Système de défis (intégration PageCMS, interface validation poulet/réalisation chasseur).
    *   Système de scoring complet et classement temps réel.
    *   Améliorations UX (animations, sons, mode sombre, avatars).
    *   Chats multiples (équipe, poulet/admin).
    *   Notifications push basiques.
    *   Optimisations performance/batterie.
*   **Phase 3: Polish & Extensibility**
    *   Historique des parties et statistiques.
    *   Système d'invitation avancé (QR codes).
    *   Intégration Bars Partenaires (si prioritaire).
    *   Options de personnalisation avancées.
    *   Préparation pour publication store (tests finaux, conformité).
*   **Future Enhancements:**
    *   Monétisation (version premium, achats intégrés).
    *   Thèmes graphiques multiples.
    *   Intégration paiements cagnotte.
    *   Fonctionnalités sociales étendues (profils, amis).

## Logical Dependency Chain
1.  **Foundation:** Auth (connexion/inscription), Création/Rejoindre Partie, Structure DB (users, games, teams, participants).
2.  **Core Map Interaction:** Affichage carte, Géolocalisation (Capacitor), Interface sélection bar (Poulet), Interface visite bar (Chasseur - nécessite Caméra Capacitor).
3.  **Basic Communication:** Chat global simple (Supabase Realtime).
4.  **Gameplay Loop MVP:** Tirage au sort Poulet, Chrono avance, Visites/Photos, Logique fin de partie basique (qui a trouvé?).
5.  **Enrichissement:** Système de Défis (CMS + Interfaces validation/réalisation), Scoring et Classement (Supabase Functions + Realtime UI updates).
6.  **UX & Polish:** Notifications Push, Chats additionnels, Animations/Sons, Mode Sombre, Historique.
7.  **Extensions:** Bars Partenaires, Monétisation.

## Risks and Mitigations / Considerations
*   **Technical Challenges:**
    *   *Risk:* Gestion précise et économe de la géolocalisation en arrière-plan. *Mitigation:* Utiliser des stratégies adaptatives de fréquence GPS (Capacitor Background Geolocation), tester intensivement sur différents appareils.
    *   *Risk:* Performance de l'application avec nombreux participants et mises à jour temps réel. *Mitigation:* Optimiser les requêtes Supabase, utiliser efficacement les subscriptions Realtime, pagination/lazy loading, tester la charge.
    *   *Risk:* Complexité de l'intégration multi-plateforme (iOS/Android nuances). *Mitigation:* Tester régulièrement sur les deux plateformes, utiliser les abstractions Capacitor autant que possible, prévoir du temps pour les ajustements spécifiques.
*   **MVP Scope Creep:**
    *   *Risk:* Vouloir intégrer trop de fonctionnalités dès la première phase. *Mitigation:* Se tenir strictement au scope défini pour la Phase 1, prioriser le gameplay de base fonctionnel. Utiliser le roadmap pour planifier les ajouts.
*   **User Adoption / Engagement:**
    *   *Risk:* Le jeu digitalisé perd de son charme ou l'app est trop complexe. *Mitigation:* Tester tôt avec des utilisateurs cibles, itérer sur l'UX pour maintenir la simplicité et l'aspect ludique, focus sur la fluidité du jeu.
*   **Monetization Strategy:**
    *   *Risk:* Modèle économique non viable ou mal perçu. *Mitigation:* Commencer avec une version gratuite solide, introduire la monétisation progressivement (si décidée), sonder l'intérêt pour les options premium.
*   **Ethical & Legal Considerations:**
    *   *Risk:* Promotion involontaire de la consommation excessive d'alcool. *Mitigation:* Inclure des messages de modération, proposer des alternatives/défis sans alcool, vérifier l'âge à l'inscription, se décharger de la responsabilité via CGU claires.
    *   *Risk:* Non-conformité RGPD (données localisation, personnelles). *Mitigation:* Anonymiser/pseudonymiser les données autant que possible, demander consentements explicites, politique de confidentialité claire, purger les données anciennes (photos, localisations précises post-partie).
    *   *Risk:* Sécurité des comptes et triche. *Mitigation:* Utiliser Supabase Auth sécurisé, mettre en place une modération/signalement, validation côté serveur pour les actions critiques (scoring).

## Appendix
*   [Lien vers maquettes Figma/UI si existantes]
*   [Spécifications détaillées de l'algorithme de scoring]
*   [Choix techniques spécifiques (librairies JS exactes pour cartes, compression image, etc.)]
*   [Stratégie détaillée de déploiement et de test]
*   Maquettes existantes à corriger et compléter dans le code source: src/pages/ChickenPage.tsx et src/pages/HunterTeamPage.tsx