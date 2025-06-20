# System Patterns

## Architecture du système

### Base de données et backend

La base de données est hébergée sur Supabase et comprend les tables suivantes :

1. **games** - Stocke les informations sur les parties en cours
   - Contient désormais un champ `chicken_team_id` qui doit être correctement mis à jour lorsqu'une équipe Chicken est créée ou rejointe
   - Utilise un champ `status` avec contrainte CHECK pour contrôler les transitions d'état valides

2. **teams** - Stocke les informations sur les équipes
   - Liée aux tables `games` et `players`
   - Différencie les équipes Chicken des équipes Player

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

3. **Ajouter des logs de débogage détaillés** pour faciliter l'identification des problèmes :
   ```typescript
   console.log('Attempting to update game status:', { gameId, newStatus });
   const { data, error } = await supabase.from('games').update({ status: newStatus }).eq('id', gameId);
   
   if (error) {
     console.error('Error updating game status:', error);
     // Gérer l'erreur
   } else {
     console.log('Game status updated successfully:', data);
   }
   ```

### Mise à jour automatique du chicken_team_id

Pour éviter les problèmes de synchronisation, nous avons implémenté une mise à jour automatique du champ `chicken_team_id` dans la table `games` lorsqu'une équipe Chicken est créée ou rejointe :

```typescript
const handleBeChicken = async () => {
  try {
    // Créer ou rejoindre l'équipe Chicken
    const { data: teamData, error: teamError } = await supabase
      .from('teams')
      .insert({
        game_id: gameId,
        name: 'Chicken Team',
        is_chicken: true,
        // autres champs...
      })
      .select();

    if (teamError) throw teamError;
    
    if (teamData && teamData.length > 0) {
      const newTeamId = teamData[0].id;
      
      // Mettre à jour le chicken_team_id dans la table games
      const { error: updateError } = await supabase
        .from('games')
        .update({ chicken_team_id: newTeamId })
        .eq('id', gameId);
        
      if (updateError) throw updateError;
      
      console.log('Chicken team created and game updated successfully');
    }
  } catch (error) {
    console.error('Error in handleBeChicken:', error);
  }
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
   - Transitions de statut contrôlées par la base de données
   - Abonnements en temps réel pour les mises à jour de statut
   - Redirection automatique basée sur les changements de statut

3. **Soumission et validation des défis**
   - Soumission de défis par les joueurs
   - Validation par l'équipe Chicken
   - Mise à jour des scores en temps réel 