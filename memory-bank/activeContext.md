# Active Context

## Current Focus

Nous travaillons actuellement sur l'amélioration de l'architecture de la base de données et la résolution des problèmes de synchronisation du statut de jeu. Nous avons refactorisé la structure de la base de données en un seul fichier de migration complet et mis en place un système robuste de mise à jour du statut de jeu.

### Problèmes récemment résolus

1. **Problème de synchronisation du statut de jeu** : Incohérences dans la mise à jour du statut de jeu entre "lobby", "in_progress" et "chicken_hidden".
   - **Cause identifiée** : Logique de mise à jour dispersée et non centralisée, manque de notifications systématiques.
   - **Solution implémentée** : Création d'une fonction SQL centralisée `update_game_status` qui gère toutes les mises à jour de statut, l'historique et les notifications.

2. **Duplication des tables et fonctions** : Confusion entre les tables `game_events` et `game_status_history`.
   - **Solution implémentée** : Clarification des rôles de chaque table (événements pour notifications, historique pour audit) et consolidation des fichiers de migration.

3. **Problème de redirection après le lancement de la partie** : Lorsque le poulet lançait la partie, les joueurs n'étaient pas automatiquement redirigés vers la page de jeu appropriée.
   - **Cause identifiée** : Le champ `chicken_team_id` dans la table `games` était NULL, ce qui causait une erreur lors de la mise à jour du statut du jeu.
   - **Solution implémentée** : Vérification systématique du champ `chicken_team_id` avant de changer le statut et amélioration de la fonction de mise à jour.

4. **Erreur lors de la mise à jour du statut du jeu** : L'erreur "Aucune partie trouvée avec cet ID" apparaissait lors du lancement de la partie.
   - **Solution implémentée** : Amélioration de la gestion des erreurs dans les requêtes Supabase et dans la fonction `update_game_status`.

### Prochaines étapes

1. **Tester la robustesse du système** : Vérifier que le système de mise à jour du statut et les notifications fonctionnent correctement dans tous les cas.

2. **Optimiser les performances** : Analyser et optimiser les performances des requêtes SQL et des fonctions.

3. **Améliorer la documentation** : Mettre à jour la documentation technique pour refléter la nouvelle architecture de la base de données.

4. **Finaliser l'interface utilisateur** : S'assurer que tous les composants UI reflètent correctement l'état du jeu et fournissent un feedback approprié aux utilisateurs.

## Décisions actives et considérations

- Nous avons décidé de centraliser toute la logique de mise à jour du statut dans une fonction SQL robuste pour garantir la cohérence des données.
- Nous avons choisi de consolider tous les fichiers de migration en un seul fichier complet pour simplifier la maintenance.
- Nous avons mis en place un système de notification en temps réel via la table `game_events` et Supabase Realtime.
- Nous avons implémenté un mécanisme d'historique complet des changements de statut via la table `game_status_history`.

## Apprentissages et insights du projet

- L'importance de centraliser la logique critique dans des fonctions SQL robustes pour garantir la cohérence des données.
- La nécessité de gérer correctement les erreurs dans les requêtes Supabase, en particulier lorsqu'on utilise `.single()` qui peut échouer si aucune ligne n'est retournée.
- L'utilité d'un système de notification en temps réel pour informer tous les clients des changements importants.
- L'importance d'un historique complet des changements pour faciliter le débogage et l'audit. 