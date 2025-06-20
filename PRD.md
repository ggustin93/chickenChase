# Spécifications - The Chicken Chase

## Overview
"The Chicken Chase" est un jeu social festif destiné à des groupes d'amis. L'objectif est de digitaliser et d'améliorer l'expérience de ce jeu existant via une application mobile. Un binôme désigné (le "poulet"), **financé par une cagnotte commune qu'il utilise pour offrir des tournées aux équipes qui le trouvent**, se cache dans un bar défini dans une zone de jeu. Les autres participants, en équipes ("chasseurs"), doivent le retrouver. **Règle sociale clé : chaque bar visité sans succès par un chasseur impose une consommation payée par l'équipe Chasseur.** L'application vise à simplifier l'organisation, ajouter une dimension ludique (défis, scoring basé sur l'ordre de trouvaille et les défis) et faciliter la communication. **La partie se termine quand toutes les équipes ont trouvé le Poulet.** Elle cible les jeunes adultes (majeurs) cherchant des activités de groupe originales. **Les 3 premières équipes au classement final remportent un prix défini par l'organisateur.**
**Pour participer, les utilisateurs s'authentifient d'abord via Magic Link (email) puis rejoignent une session de jeu spécifique à l'aide d'un code fourni par l'organisateur.**

## Core Features

### 1. Admin: Configuration et Lancement de Partie
*   **Rôle Principal:** Admin / Organisateur (l'utilisateur qui crée la partie)
*   **What it does:** Permet à l'**Admin** de créer une nouvelle partie, d'en définir les paramètres (zone géographique sur carte interactive, montant cagnotte initiale, nombre max participants/équipes), de sélectionner les défis initiaux à partir d'une liste prédéfinie (via CMS), et de générer un **code unique que les joueurs authentifiés utiliseront pour rejoindre la partie**. Gère l'attribution aléatoire du rôle "poulet" lors du lancement effectif de la partie.
*   **Why it's important:** Simplifie l'organisation fastidieuse du jeu, assure l'équité (tirage au sort) et centralise les informations de la partie.
*   **How it works:** Formulaire de création dédié à l'Admin. Intégration carte (Mapbox/Leaflet via Capacitor). Interface de sélection de défis (cocher/décocher depuis liste CMS). Système d'invitation (**partage du code généré**). Algorithme de tirage au sort (Supabase Function `assign_chicken_role` appelée au lancement).

### 2. Rôle Poulet: Gestion de Partie et Interactions
*   **What it does:** Fournit au binôme "poulet" les outils pour gérer sa partie : sélection bar initial, chrono avance, validation soumissions (défis, visites bar si GPS échoue), communication (chat, indices), visualisation photos équipes, confirmation manuelle des équipes trouvées (via onglet Score), **enregistrement des dépenses de la Cagnotte (principalement pour offrir des tournées aux équipes qui l'ont trouvé)**, ajout défis personnalisés. Est notifié des soumissions.
*   **Why it's important:** Rôle central, gestion dynamique du jeu, anime la fin de partie.
*   **How it works:** Interface dédiée avec carte filtrée sur la zone de jeu, timer visuel. Onglet Défis avec filtres ("En attente", "Approuvés", "Refusés") et indicateurs de nouvelles soumissions. **Fonctionnalité "Ajouter Défi" permettant au Poulet de saisir titre, description, points, et type de preuve (photo/vidéo simplifié à photo pour MVP?) pour un nouveau défi qui sera ajouté à la liste de toutes les équipes.** Flux de validation pour défis et visites de bar. Interface de chat dédiée, galerie photos reçues. Onglet Score/Classement incluant un bouton "Confirmer Trouvé". Section dédiée ou bouton flottant pour l'enregistrement rapide des dépenses (**ex: "Tournée générale (finders) ≈ X€"**). **Il n'y a pas de partage monétaire final de la cagnotte; elle est consommée par le Poulet durant la partie.**

### 3. Rôle Chasseur: Recherche et Participation
*   **What it does:** Équipe les chasseurs : carte, historique visites, liste défis, capture/upload preuves, chat équipe, marquage visites. **Note contextuelle : la règle sociale impose aux chasseurs de consommer (sur fonds propres) dans les bars visités sans succès.** Implémente validation visites (GPS/photo).
*   **Why it's important:** Fournit tous les outils nécessaires à la recherche, à la complétion des défis et à la compétition entre équipes.
*   **How it works:** Interface avec carte interactive et vue liste des bars. Processus de visite : 1) L'équipe marque manuellement un bar comme visité. 2) L'app vérifie la proximité GPS. Si OK, la visite est validée (`status='gps_validated'`). 3) Si GPS échoue, l'app demande une photo via la caméra native (Capacitor). 4) La photo est uploadée (`status='pending_photo_validation'`), en attente de validation par le Poulet. Liste de défis cochables, intégration caméra native, système de chat par équipe, compteur visible incrémenté à chaque validation de bar (`gps_validated` ou `photo_validated`). **Les défis rejetés peuvent être re-soumis.**

### 4. Tous Rôles: Communication Centralisée
*   **What it does:** Intègre différents canaux de communication : chat global (tous les participants), chat privé (poulet/admin), diffusion d'indices par le poulet, notifications push pour événements clés (y compris, optionnellement, les soumissions de défis en attente pour le Poulet, **et l'ajout de nouveaux défis par le Poulet**).
*   **Why it's important:** Facilite l'interaction, maintient l'engagement et informe les joueurs en temps réel.
*   **How it works:** Utilisation des Realtime Features de Supabase pour les chats, Supabase Functions pour la logique de diffusion d'indices et l'envoi de notifications push (via intégration service push **et potentiellement trigger DB sur table `challenges`**).

### 5. Tous Rôles: Scoring et Classement
*   **What it does:** Calcule scores (défis), attribue points majeurs (ordre découverte Poulet), affiche classement dynamique. **Le nombre de bars visités influence indirectement le score (temps perdu) mais n'est pas un facteur direct de points (+ ou -).** Fin de partie quand toutes les équipes ont `found_chicken_at` non NULL. Détermine le Top 3 pour les prix. **La Cagnotte n'est pas un facteur de score ou de récompense finale distribuée via l'app.**
*   **Why it's important:** Compétition, récompense rapidité/défis, détermine gagnants prix.
*   **How it works:** Logique de scoring (Supabase Function `update_score`) déclenchée par validation de visite, validation de défi, et **confirmation de trouvaille par le Poulet (qui enregistre un timestamp de découverte)**. Points pour découverte dégressifs (ex: 1er=500pts, 2e=400pts, etc.). Mise à jour DB en temps réel, interface de classement (subscriptions Supabase), stockage résultats. **La `cagnotte_remaining` est juste une information pour le Poulet.**

### 6. Optionnel/Extension: Intégration Bars Partenaires
*   **What it does:** Permet aux bars de devenir partenaires, offrant potentiellement des avantages aux joueurs et une visibilité accrue aux bars. Inclut un formulaire d'inscription pour les bars et une signalétique spéciale sur la carte du jeu.
*   **Why it's important:** Peut créer un écosystème autour du jeu et potentiellement une source de revenus/partenariats.
*   **How it works:** Section dédiée dans l'app (ou formulaire web externe via QR code) pour la soumission d'informations par les gérants, stockage des données des bars partenaires dans Supabase, affichage différencié sur la carte.

## User Experience (UX)
*   **User Personas:** Jeunes adultes (18-35 ans), sociables, appréciant les jeux de groupe et les sorties en bar, à l'aise avec les applications mobiles. Inclure persona "Organisateur", "Poulet", "Chasseur".
*   **Key User Flows:**
    1.  Flux de l'Admin/Organisateur: Création partie (définition zone, cagnotte, équipes, sélection défis initiaux), **partage du code de partie aux joueurs (qui doivent d'abord s'authentifier)**.
    2.  Flux du Poulet: **Authentification (Magic Link), rejoindre la partie (code reçu),** Démarrage, sélection bar, attente, validation soumissions, envoi indices, ajout défis (opt.), **log dépenses (pour tournées aux finders)**, confirmation équipes trouvées.
    3.  Flux Chasseur: **Authentification (Magic Link), rejoindre la partie (code reçu),** Consultation carte/liste, déplacement bar (consommation si bar incorrect - règle sociale), marquage visite (GPS/photo), réalisation/soumission défi, localisation Poulet, consultation classement, poursuite défis (opt.). **Peut bénéficier des tournées offertes par le Poulet via la Cagnotte une fois trouvé.**
    4.  Fin de partie: Se produit quand toutes les équipes ont `found_chicken_at` non NULL. Affichage classement final, attribution prix (hors-app). **Pas de gestion de partage de cagnotte.**

*   **Synthèse des Fonctionnalités par Rôle:**
    *   **Admin (Organisateur):**
        *   Créer une nouvelle partie.
        *   Définir les paramètres de la partie : zone géographique (carte interactive), montant de la cagnotte initiale, nombre maximum de participants/équipes.
        *   Sélectionner les défis initiaux à partir d'une liste prédéfinie (CMS).
        *   Générer et partager un code de partie unique.
        *   (Système) Gérer l'attribution aléatoire du rôle "Poulet" au lancement.
        *   Accéder à un chat privé avec le Poulet (si implémenté).
    *   **Poulet (Chicken - Binôme):**
        *   S'authentifier et rejoindre une partie avec un code.
        *   Sélectionner le bar initial où se cacher (carte).
        *   Visualiser le chrono d'avance pour se cacher.
        *   Valider/Refuser les soumissions de défis des équipes Chasseurs.
        *   Valider/Refuser les visites de bar soumises avec photo (si GPS échoue pour Chasseur).
        *   Communiquer avec toutes les équipes (envoyer des indices, messages via chat global).
        *   Communiquer en privé avec l'Admin (si implémenté).
        *   Visualiser les photos soumises par les équipes Chasseurs.
        *   Confirmer manuellement chaque équipe Chasseur qui trouve le Poulet (enregistre `found_chicken_at` et `found_order`).
        *   Enregistrer les dépenses de la Cagnotte (ex: tournées offertes).
        *   Ajouter des défis personnalisés en cours de partie (titre, description, points, type de preuve).
        *   Consulter le classement et le statut des équipes.
    *   **Chasseur (Hunter - Membre d'équipe):**
        *   S'authentifier et rejoindre une partie avec un code.
        *   Consulter la carte interactive de la zone de jeu et la liste des bars.
        *   Marquer un bar comme visité : validation par GPS ou soumission d'une photo si GPS échoue.
        *   (Règle sociale) Consommer sur fonds propres dans les bars visités sans succès.
        *   Consulter la liste des défis disponibles.
        *   Capturer et soumettre des preuves pour les défis réalisés (photos).
        *   Communiquer avec les membres de sa propre équipe (chat d'équipe).
        *   Consulter le chat global et les indices du Poulet.
        *   Visualiser le score de son équipe et le classement général.
        *   Être informé du statut de ses soumissions de défis/visites (validé, rejeté, en attente).

*   **UI/UX Considerations:**
    *   Interface très simple, utilisable facilement même en état d'ébriété (gros boutons, navigation claire).
    *   Thème graphique ludique et reconnaissable (poulet/ferme).
    *   Mode sombre indispensable pour usage nocturne.
    *   Feedback clair : sons et animations pour actions clés (validation défi, trouvaille poulet, etc.).
    *   Optimisation pour l'autonomie (gestion fréquence GPS).
    *   Avatars/Noms d'équipes personnalisables.
    *   **Mention claire de la règle sociale : les Chasseurs paient leurs consommations dans les bars visités sans succès.**

## Technical Architecture
*   **System Components:**
    *   Frontend Mobile App: Ionic React (UI), Capacitor (Native Access - GPS, Camera, Push). PWA uniquement, pas de build natif.
    *   Backend: Supabase (Auth, Database - PostgreSQL, Storage, Realtime, Edge Functions).
    *   CMS: PageCMS (Gestion contenu dynamique - Défis, Règles).
*   **Implementation Status:**
    *   **Frontend (Prototype):**
        *   Des prototypes frontend (sans backend connecté) existent pour les principales vues/pages :
            *   `src/pages/Home.tsx` (Accueil/Connexion)
            *   `src/pages/AdminPage.tsx` (Configuration Partie)
            *   `src/pages/ChickenPage.tsx` (Interface Poulet): Gère les onglets Carte (`MapTabContent`), Défis (`ChallengesTabContent`), Chat (`ChatTabContent`), et Équipes (`TeamsTabContent`) pour le rôle Poulet.
            *   `src/pages/PlayerPage.tsx` (Interface Chasseur): Gère les onglets Carte (`MapTab`), Défis (`ChallengesTab`), Chat/Newsfeed (`ChatTab`), et Score/Classement (`LeaderboardTab`) pour les Chasseurs.
            *   `src/pages/Rules.tsx` (Règles)
            *   `src/pages/Partner.tsx` (Bars Partenaires - optionnel)
            *   `src/pages/About.tsx` (À Propos)
        *   L'implémentation utilise des composants réutilisables (`src/components`) structurés par rôle (`admin/`, `chicken/`, `player/`) et partagés (`shared/`).
        *   **Note:** Ce prototype a été développé rapidement. Il utilise un mélange de composants Ionic UI, de classes Tailwind CSS, et de CSS custom (`.css` files). Une revue et une refactorisation potentielle pour **standardiser le styling** et aligner avec les meilleures pratiques Ionic/React (décomposition, hooks personnalisés, gestion d'état, etc.) seraient bénéfiques avant une production complète.
    *   **Backend (Supabase):**
        *   **Status:** À implémenter et vérifier entièrement.
        *   Les Data Models sont définis ci-dessous, mais les Edge Functions, les politiques RLS (Row Level Security), et les triggers nécessaires doivent être créés et testés.
*   **Data Models (Supabase - PostgreSQL):**
    *   `games`: id, settings (jsonb: zone_coords, **cagnotte_initiale**, etc.), status, chicken_team_id, created_at, **cagnotte_remaining (NUMERIC)**.
    *   `teams`: id, game_id, user_ids (array), name, avatar_url, score, bars_visited_count, **found_chicken_at (TIMESTAMPZ NULL), found_order (INTEGER NULL)**.
    *   `users`: id (Supabase Auth), profile_info (jsonb).
    *   `participants`: user_id, game_id, team_id, role (chicken/hunter).
    *   `visits`: id (UUID), team_id (UUID FK `teams.id`), game_id (UUID FK `games.id`), bar_name (TEXT), location (geometry(Point, 4326) NOT NULL), validation_photo_url (TEXT NULL), status (TEXT NOT NULL DEFAULT 'pending_gps_check', options: 'pending_gps_check', 'gps_validated', 'pending_photo_validation', 'photo_validated', 'photo_rejected'), created_at (TIMESTAMPZ NOT NULL DEFAULT now()), validated_at (TIMESTAMPZ NULL).
    *   `challenges`: id (UUID), game_id (UUID FK `games.id`), team_id (UUID FK `teams.id`), challenge_def_id (UUID FK - from CMS/local definitions, **NULL si ajouté par Poulet**), **custom_title (TEXT NULL), custom_description (TEXT NULL), custom_points (INTEGER NULL), custom_proof_type (TEXT NULL)**, status (TEXT NOT NULL DEFAULT 'pending_submission', options: 'pending_submission', 'pending_validation', 'approved', 'rejected'), proof_photo_url (TEXT NULL), submitted_at (TIMESTAMPZ NULL), validated_at (TIMESTAMPZ NULL).
    *   `messages`: id, game_id, user_id, team_id (nullable), content, timestamp.
    *   `partner_bars` (Optionnel): id, name, address, coords, description, logo_url, offers (jsonb).
*   **APIs and Integrations:**
    *   Supabase REST/GraphQL API pour interactions DB/Auth/Storage.
    *   Supabase Realtime pour chat et mises à jour live.
    *   Supabase Edge Functions pour logique métier (scoring, tirage au sort, notifications, **log_expense**, purge photos).
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


## Fonctionnalités Clés par Écran (Basé sur Captures d'Écran)

Cette section détaille les fonctionnalités visibles via les captures d'écran fournies, organisées par onglet principal et rôle utilisateur. La barre de navigation inférieure semble comporter : Carte, Défis, Chat, Score/Classement.

### Onglet: Carte
*   **Tous les Rôles (Vue Carte):**
    *   Visualiser la carte interactive de la zone de jeu.
    *   Voir les marqueurs des bars disponibles (icône bière orange). Certains bars peuvent être grisés (visitės ? exclus ?).
    *   Voir sa propre position (si activée/disponible).
    *   Zoomer/Dézoomer sur la carte.
    *   Accéder à la vue Liste via une icône en haut.
*   **Rôle Poulet (Vue Carte):**
    *   Voir le compte à rebours initial "Pour se cacher" (capture précédente).
    *   Visualiser le nom et l'adresse du bar sélectionné pour se cacher (capture précédente).
    *   Bouton d'action "JE SUIS CACHÉ ICI !" pour confirmer le lieu initial (capture précédente).
*   **Rôle Chasseur (Vue Carte):**
    *   Affichage de cartes d'information clés sous la carte :
        *   Score actuel (ex: "225 pts").
        *   Temps restant (ex: "02:12:15 RESTANT").
        *   Nombre de bars visités sur le total (ex: "2/15 BARS").
        *   Nombre de défis complétés sur le total (ex: "1/8 DÉFIS").
        *   Statut de la Cagnotte Équipe (ex: "350€", barre de progression "44% restant sur 800€").
*   **Rôle Chasseur (Vue Liste):**
    *   Accessible via une icône en haut de l'onglet Carte.
    *   Titre indiquant le nombre de lieux visités (ex: "Lieux à visiter (2/15)").
    *   Liste des bars de la zone de jeu avec :
        *   Image illustrative.
        *   Nom du bar (ex: "Chez Poule & Coq", "La Plume Dorée").
        *   Adresse (si disponible).
        *   Indicateur de statut : Coche verte + "Déjà visité" pour les bars visités par l'équipe; Radio bouton pour les bars non visités.
        *   Flèche pour potentiellement naviguer vers les détails du bar ou lancer une action (visite, photo?).

### Onglet: Défis
*   **Rôle Poulet:**
    *   (Basé sur captures précédentes) Filtrage par "En attente", "Approuvés", "Refusés".
    *   Approuver/Refuser les défis soumis par les équipes.
*   **Rôle Chasseur:**
    *   Voir la liste des défis disponibles pour son équipe.
    *   Pour chaque défi :
        *   Titre et description (ex: "Trinquons entre inconnus!", "Danse du poulet").
        *   Points associés (ex: "🏆 50 pts", "🏆 100 pts").
        *   Statut actuel du défi pour l'équipe :
            *   Indicateur visuel (Radio bouton = à faire, Coche verte = validé, Horloge = en attente de validation).
            *   Tag textuel (ex: "À faire", "Validé", "En attente").
        *   Icône indiquant le type de preuve requise (ex: Appareil photo pour un selfie).
        *   Flèche pour accéder aux détails ou soumettre la preuve.

### Onglet: Chat / Newsfeed
*   **Tous les Rôles:**
    *   Voir un flux d'événements et de messages.
    *   Consulter les messages système : Notification de début de partie, défi complété par une équipe (+points), mise à jour du classement, **mise à jour de la cagnotte (suite à dépense enregistrée par le Poulet)**.
    *   Lire les messages/indices envoyés par le Poulet (texte et/ou image).
    *   Voir l'heure d'envoi des messages/événements.
*   **Rôle Poulet:**
    *   (Basé sur captures précédentes) Accès à l'envoi d'indice via bouton flottant et modale dédiée (texte/photo).

### Onglet: Score / Classement
*   **Tous les Rôles:**
    *   Voir le classement général des équipes.
    *   Filtrer les équipes par statut : "Tous", "A trouvé", "En chasse" (basé sur `found_chicken_at` IS NOT NULL).
    *   Voir les informations clés pour chaque équipe listée :
        *   Classement numérique (basé sur score et `found_order`).
        *   Nom de l'équipe (ex: "Chicken Run", "Équipe KFC").
        *   Score total actuel (ex: "⭐ 500", "⭐ 410").
        *   Indicateurs de progression (ex: icônes livre 📖 pour bars visités?, coche ✅ pour défis réussis?).
        *   **Indication si l'équipe a trouvé le Poulet (ex: tag "A trouvé", visible par tous).**
*   **Rôle Poulet:**
    *   **Action : Bouton "Confirmer Trouvé" à côté de chaque équipe "En chasse". Cliquer enregistre `found_chicken_at` et détermine `found_order` pour cette équipe.**
*   **Rôle Chasseur:**
    *   Identification de sa propre équipe dans la liste (ex: "(vous)").
    *   Voit le statut "A trouvé" pour toutes les équipes confirmées par le Poulet.
    *   Le bouton "MARQUER TROUVÉ" n'est pas utilisé pour la validation de la trouvaille.