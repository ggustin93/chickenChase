# System Patterns

## Architecture du système

### Base de données et backend

La base de données est hébergée sur Supabase et comprend les tables suivantes :

1. **games** - Stocke les informations sur les parties en cours
   - Contient un champ `chicken_team_id` qui doit être correctement mis à jour lorsqu'une équipe Chicken est créée ou rejointe
   - Utilise un champ `status` avec contrainte CHECK pour contrôler les transitions d'état valides
   - Stocke le timestamp `chicken_hidden_at` pour suivre quand le poulet s'est caché

2. **teams** - Stocke les informations sur les équipes
   - Liée aux tables `games` et `players`
   - Différencie les équipes Chicken des équipes Player via le champ `is_chicken_team`

3. **players** - Stocke les informations sur les joueurs
   - Utilise un système de session sans authentification basé sur localStorage
   - Liée à la table `teams`

4. **challenges** - Stocke les défis disponibles pour chaque partie
   - Différents types de défis (photo, unlock)
   - Points associés à chaque défi

5. **challenge_submissions** - Stocke les soumissions de défis par les équipes
   - Statut (pending, approved, rejected)
   - Lien vers le défi et l'équipe

6. **messages** - Stocke les messages du chat pour chaque partie

7. **game_events** - Stocke les événements pour les notifications en temps réel
   - Utilisée pour informer tous les clients des changements importants
   - Structure flexible avec `event_type` et `event_data` (JSON)

8. **game_status_history** - Stocke l'historique des changements de statut
   - Garde une trace complète de tous les changements pour audit et débogage
   - Stocke l'ancien et le nouveau statut, ainsi que des métadonnées

### Fonctions SQL centralisées

Pour garantir la cohérence des données et simplifier la maintenance, nous avons implémenté des fonctions SQL centralisées :

1. **update_game_status** - Fonction principale pour mettre à jour le statut d'une partie
   ```sql
   CREATE OR REPLACE FUNCTION public.update_game_status(game_id uuid, new_status text)
   RETURNS json
   LANGUAGE plpgsql
   SECURITY DEFINER
   AS $$
   DECLARE
     game_record record;
     updated_game record;
     old_status text;
   BEGIN
     -- 1. Vérifier que la partie existe et récupérer ses informations
     SELECT * INTO game_record FROM public.games WHERE id = game_id;
     
     IF NOT FOUND THEN
       RAISE EXCEPTION 'Partie non trouvée avec l''ID: %', game_id;
     END IF;
     
     old_status := game_record.status;
     
     -- 2. Vérifier que le nouveau statut est valide
     IF new_status NOT IN ('lobby', 'in_progress', 'chicken_hidden', 'finished', 'cancelled') THEN
       RAISE EXCEPTION 'Statut invalide: %. Les statuts valides sont: lobby, in_progress, chicken_hidden, finished, cancelled', new_status;
     END IF;
     
     -- 3. Vérifier que chicken_team_id est défini si on passe à in_progress ou chicken_hidden
     IF (new_status = 'in_progress' OR new_status = 'chicken_hidden') AND game_record.chicken_team_id IS NULL THEN
       RAISE EXCEPTION 'L''équipe poulet n''est pas définie pour cette partie';
     END IF;
     
     -- 4. Mettre à jour le statut
     UPDATE public.games
     SET 
       status = new_status,
       updated_at = NOW(),
       -- Mettre à jour chicken_hidden_at uniquement si on passe à chicken_hidden
       chicken_hidden_at = CASE WHEN new_status = 'chicken_hidden' THEN NOW() ELSE chicken_hidden_at END
     WHERE id = game_id
     RETURNING * INTO updated_game;
     
     -- 5. Enregistrer le changement de statut dans l'historique
     INSERT INTO public.game_status_history (
       game_id,
       old_status,
       new_status,
       metadata
     ) VALUES (
       game_id,
       old_status,
       new_status,
       jsonb_build_object(
         'chicken_team_id', updated_game.chicken_team_id,
         'chicken_hidden_at', updated_game.chicken_hidden_at
       )
     );
     
     -- 6. Insérer un événement de notification pour tous les clients
     INSERT INTO public.game_events (
       game_id,
       event_type,
       event_data
     ) VALUES (
       game_id,
       'status_change',
       jsonb_build_object(
         'status', new_status,
         'message', CASE 
           WHEN new_status = 'in_progress' THEN 'La partie a commencé!'
           WHEN new_status = 'chicken_hidden' THEN 'Le poulet est caché! La chasse est lancée!'
           WHEN new_status = 'finished' THEN 'La partie est terminée!'
           WHEN new_status = 'cancelled' THEN 'La partie a été annulée!'
           ELSE 'Le statut de la partie a changé!'
         END
       )
     );
     
     -- 7. Retourner les informations mises à jour
     RETURN jsonb_build_object(
       'success', true,
       'game_id', updated_game.id,
       'old_status', old_status,
       'new_status', updated_game.status,
       'chicken_hidden_at', updated_game.chicken_hidden_at
     );
   END;
   $$;
   ```

2. **create_game_and_host** - Crée une partie et un joueur hôte
   ```sql
   CREATE OR REPLACE FUNCTION public.create_game_and_host(host_nickname text default 'Hôte')
   RETURNS json
   LANGUAGE plpgsql
   SECURITY DEFINER
   AS $$
   DECLARE
     new_join_code text;
     new_player_id uuid;
     new_game_id uuid;
     attempts integer := 0;
   BEGIN
     -- Génère un code de partie unique et facile à lire
     LOOP
       new_join_code := (
         SELECT string_agg(ch, '')
         FROM (
           SELECT (array['A','B','C','D','E','F','G','H','J','K','L','M','N','P','Q','R','S','T','U','V','W','X','Y','Z','2','3','4','5','6','7','8','9'])[floor(random() * 32) + 1]
           FROM generate_series(1, 6)
         ) AS a(ch)
       );
       EXIT WHEN NOT EXISTS (SELECT 1 FROM public.games g WHERE g.join_code = new_join_code);
       
       attempts := attempts + 1;
       IF attempts > 10 THEN
         RAISE EXCEPTION 'Impossible de générer un code de partie unique.';
       END IF;
     END LOOP;

     -- Crée la partie, le joueur hôte et retourne les informations
     -- ...
   END;
   $$;
   ```

3. **update_chicken_hidden_status** - Fonction de rétrocompatibilité qui appelle update_game_status
   ```sql
   CREATE OR REPLACE FUNCTION public.update_chicken_hidden_status(game_id uuid)
   RETURNS json
   LANGUAGE plpgsql
   SECURITY DEFINER
   AS $$
   BEGIN
     -- Appeler simplement la nouvelle fonction update_game_status
     RETURN public.update_game_status(game_id, 'chicken_hidden');
   END;
   $$;
   ```

### Gestion des erreurs dans les requêtes Supabase

Pour éviter les erreurs liées à l'absence de données, nous avons adopté les pratiques suivantes :

1. **Éviter l'utilisation de `.single()`** qui échoue si aucune ligne n'est retournée. À la place :
   ```typescript
   // ❌ À ÉVITER
   const { data, error } = await supabase.from('games').select('*').eq('id', gameId).single();
   
   // ✅ À FAIRE
   const { data, error } = await supabase.from('games').select('*').eq('id', gameId);
   if (error) {
     console.error('Error fetching game:', error);
     return;
   }
   
   if (data && data.length > 0) {
     const game = data[0];
     // Traiter les données
   } else {
     console.error('No game found with ID:', gameId);
     // Gérer le cas où aucune donnée n'est trouvée
   }
   ```

2. **Vérifier l'existence des données avant de les mettre à jour** :
   ```typescript
   // Vérifier d'abord l'existence
   const { data: existingGame } = await supabase.from('games').select('id').eq('id', gameId);
   
   if (existingGame && existingGame.length > 0) {
     // Procéder à la mise à jour
     const { data, error } = await supabase.from('games').update({ status: 'in_progress' }).eq('id', gameId);
   }
   ```

3. **Utiliser les fonctions RPC pour les opérations critiques** :
   ```typescript
   // Utiliser la fonction RPC pour mettre à jour le statut
   const { data, error } = await supabase.rpc('update_game_status', {
     game_id: gameId,
     new_status: 'in_progress'
   });
   
   if (error) {
     console.error('Error updating game status:', error);
     // Gérer l'erreur
   } else {
     console.log('Game status updated successfully:', data);
   }
   ```

### Système de notification en temps réel

Pour informer tous les clients des changements importants, nous avons mis en place un système de notification en temps réel :

1. **Insertion d'événements dans la table `game_events`** :
   - Chaque événement a un `event_type` et des `event_data` (JSON)
   - Les événements sont insérés automatiquement par la fonction `update_game_status`

2. **Abonnement aux événements via Supabase Realtime** :
   ```typescript
   const subscription = supabase
     .channel(`game-events-${gameId}`)
     .on('postgres_changes', {
       event: 'INSERT',
       schema: 'public',
       table: 'game_events',
       filter: `game_id=eq.${gameId}`
     }, (payload) => {
       console.log('Nouvel événement:', payload);
       // Traiter l'événement selon son type
       if (payload.new.event_type === 'status_change') {
         // Mettre à jour l'interface utilisateur
       }
     })
     .subscribe();
   
   // Ne pas oublier de se désabonner
   return () => {
     subscription.unsubscribe();
   };
   ```

## Patterns de conception

### Composants React

1. **Composants fonctionnels avec hooks** - Tous les composants sont des fonctions utilisant les hooks React

2. **Décomposition en petits composants** - Les pages complexes sont divisées en composants plus petits et réutilisables

3. **Custom hooks pour la logique** - La logique complexe est extraite dans des hooks personnalisés

### Gestion de l'état

1. **Context API pour l'état global** - Utilisation de React Context pour partager l'état entre composants

2. **useState pour l'état local** - Utilisation de useState pour gérer l'état spécifique à un composant

3. **useEffect pour les effets de bord** - Gestion des abonnements Supabase et autres effets

### Temps réel avec Supabase

1. **Canaux spécifiques** - Utilisation de canaux Supabase dédiés pour chaque type de données

2. **Abonnements et désabonnements propres** - Gestion correcte des abonnements dans useEffect

3. **Gestion des erreurs** - Traitement approprié des erreurs dans les requêtes et abonnements

## Relations entre composants

### Flux de données

1. **Top-down props** - Les données sont passées des composants parents aux enfants via props

2. **Context pour l'état partagé** - L'état global est géré via React Context

3. **Custom hooks pour la logique réutilisable** - La logique commune est extraite dans des hooks

### Navigation

1. **IonRouterOutlet pour le routage** - Utilisation du routeur Ionic pour la navigation

2. **Redirection basée sur l'état** - Redirection automatique basée sur l'état du jeu

3. **useIonRouter pour la navigation programmatique** - Navigation via code lorsque nécessaire

## Chemins d'implémentation critiques

1. **Création et gestion des parties**
   - Création de partie via la page d'accueil
   - Gestion des joueurs et équipes dans le lobby
   - Lancement de la partie par l'équipe Chicken

2. **Gestion du statut du jeu**
   - Transitions de statut contrôlées par la fonction `update_game_status`
   - Historique complet des changements via la table `game_status_history`
   - Notifications en temps réel via la table `game_events`
   - Redirection automatique basée sur les changements de statut

3. **Soumission et validation des défis**
   - Soumission de défis par les joueurs
   - Validation par l'équipe Chicken
   - Mise à jour des scores en temps réel

## Patterns d'architecture avancés

### PWA Pattern
- **Service Worker** : Architecture offline-first avec intelligent caching
- **PWA Install Prompt** : Cross-platform installation avec détection automatique
- **Background Sync** : Synchronisation en arrière-plan pour actions offline
- **Cache Strategy** : Multi-layer caching (shell, API, dynamic content)

### Service Layer Pattern
- **addressService** : Service pour la géolocalisation et géocodage avec cache intelligent et retry logic
- **openStreetMapService** : Service d'intégration OpenStreetMap avec CORS fixes et network resilience
- **GameEventService** : Service de gestion des événements de jeu avec notifications temps réel
- **Data validation pattern** : Utilisation de TypeScript types et validation des données
- **PWA Services** : Service worker avec offline-first caching et background sync

### Game Flow Enhancement Pattern
- **FinishGameButton Component** : Confirmation dialog pattern avec error handling
- **Enhanced State Management** : Optimisations performance avec memoization
- **Navigation Coordination** : Parent-controlled navigation avec session cleanup
- **Event Service Integration** : Centralized event management avec real-time updates

### Performance Optimization Patterns
- **Memoization Strategy** : Component et callback memoization pour réduire re-renders
- **Intelligent Caching** : Multi-level cache avec invalidation strategies
- **Network Resilience** : Retry logic et fallback mechanisms
- **Mobile Optimization** : Touch-friendly interfaces avec performance budgets 