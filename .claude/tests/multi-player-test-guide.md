# Guide de Test Multi-Joueurs - Chicken Chase

## 🔧 Configuration Test 2 Navigateurs

### Méthode 1: Navigateurs Différents
```bash
# Terminal 1 - Démarrer le serveur
npm run dev

# Browser 1: Chrome
http://localhost:5174

# Browser 2: Firefox/Safari
http://localhost:5174
```

### Méthode 2: Mode Incognito
```bash
# Browser 1: Mode normal
http://localhost:5174

# Browser 2: Mode incognito/privé
http://localhost:5174
```

### Méthode 3: Profils Chrome
```bash
# Chrome Profile 1
chrome --user-data-dir=/tmp/chrome-profile-1 http://localhost:5174

# Chrome Profile 2
chrome --user-data-dir=/tmp/chrome-profile-2 http://localhost:5174
```

## 🎮 Scénarios de Test Flow Complet

### Test 1: Création & Rejoint Basique
**Joueur 1 (Organisateur)**:
1. ✅ Aller sur http://localhost:5174
2. ✅ Cliquer "Créer une Partie"
3. ✅ Pseudo: `Organisateur`, Cagnotte: `25€`
4. ✅ Cliquer "Créer la Partie"
5. ✅ Noter le code (ex: `DR8E26`)
6. ✅ Cliquer "Devenir l'Équipe Poulet"

**Joueur 2 (Participant)**:
1. ✅ Aller sur http://localhost:5174
2. ✅ Cliquer "Rejoindre une Partie"
3. ✅ Code: `DR8E26`, Pseudo: `Chasseur1`
4. ✅ Cliquer "Rejoindre"
5. ✅ Créer équipe "Les Chasseurs"
6. ✅ Rejoindre l'équipe créée

**Validation Temps Réel**:
- [ ] Joueur 1 voit immédiatement Joueur 2 arriver
- [ ] Compteurs se mettent à jour (2 joueurs, 2 équipes)
- [ ] Équipes affichées correctement côté Joueur 1

### Test 2: Démarrage de Partie
**Joueur 1 (Poulet)**:
1. ✅ Cliquer "Commencer la Partie"
2. ✅ Vérifier redirection vers `/chicken/[gameId]`

**Joueur 2 (Chasseur)**:
1. ✅ Vérifier redirection automatique vers `/player/[gameId]`

## 🔄 Tests de Robustesse Session

### Test 3: Sortie/Retour Navigateur
**Scenario A: Fermeture Navigateur**
1. ✅ Joueur 2 ferme complètement le navigateur
2. ✅ Joueur 1 voit-il la déconnexion ?
3. ✅ Joueur 2 rouvre navigateur → http://localhost:5174
4. ✅ Redirection automatique vers lobby ?

**Scenario B: Rafraîchissement Page**
1. ✅ Joueur 2 rafraîchit (F5) dans le lobby
2. ✅ Retour automatique au lobby ?
3. ✅ Session maintenue ?

**Scenario C: Navigation Externe**
1. ✅ Joueur 2 va sur une autre URL
2. ✅ Retour avec bouton "Précédent"
3. ✅ État maintenu ?

### Test 4: Cas d'Erreur Session
**Scenario A: Session Corrompue**
1. ✅ Ouvrir DevTools → Application → localStorage
2. ✅ Modifier `player-session` (corrompre JSON)
3. ✅ Rafraîchir page
4. ✅ Redirection vers home ?

**Scenario B: Game ID Invalide**
1. ✅ Modifier URL: `/lobby/INVALID-ID`
2. ✅ Gestion d'erreur appropriée ?

## 📊 Validation Real-Time Updates

### Test 5: Synchronisation États
**Actions Simultanées**:
1. ✅ Joueur 1 & 2 créent équipes en même temps
2. ✅ Vérifier cohérence affichage
3. ✅ Pas de doublons ?

**Latence Network**:
1. ✅ DevTools → Network → Throttling "Slow 3G"
2. ✅ Actions restent synchronisées ?

## 🛠 Debug Multi-Joueurs

### Console Logs à Surveiller
```javascript
// Browser 1
console.log("Current gameId from URL params:", gameId);
console.log("Current gameId from session:", session.gameId);
console.log("Player change received:", payload);

// Browser 2
console.log("Game status change detected:", payload);
console.log("Redirecting to game page:", `/player/${gameId}`);
```

### DevTools Network
- ✅ WebSocket connections actives
- ✅ Supabase Realtime events
- ✅ POST requests vers `/rest/v1/rpc/`

### localStorage Inspector
```javascript
// Vérifier session
JSON.parse(localStorage.getItem('player-session'))

// Expected:
{
  playerId: "uuid",
  gameId: "uuid", 
  nickname: "string",
  teamId: "uuid",
  isChickenTeam: boolean,
  gameStatus: "lobby|in_progress"
}
```

## ⚠️ Points Critiques à Tester

### Gestion Déconnexion
- [ ] Player supprimé de Supabase après déconnexion ?
- [ ] RLS policies permettent reconnexion ?
- [ ] Équipes vides automatiquement supprimées ?

### Course Conditions
- [ ] 2 joueurs cliquent "Devenir Poulet" simultanément
- [ ] Création équipe avec même nom
- [ ] Démarrage partie avant que tous aient rejoint

### Edge Cases
- [ ] Partie démarrée pendant qu'un joueur rejoint
- [ ] Organisateur quitte avant démarrage
- [ ] Navigateur sans support WebSocket

## 🎯 Métriques de Succès

### Performance
- ✅ Sync temps réel < 1 seconde
- ✅ Reconnexion < 3 secondes
- ✅ Pas de memory leaks (DevTools Performance)

### UX
- ✅ Feedback visuel immédiat
- ✅ Messages d'erreur clairs
- ✅ Pas de states "cassés"

### Robustesse
- ✅ 100% récupération session valide
- ✅ Graceful degradation si WebSocket fail
- ✅ Consistent state entre navigateurs

---

## 🚀 Script de Test Rapide

```bash
# Test automatisé basique
npm run test.e2e

# Test manuel: ouvrir 2 onglets
open -a "Google Chrome" http://localhost:5174
open -a "Safari" http://localhost:5174
```

**Durée estimation**: 15-20 minutes pour test complet
**Fréquence recommandée**: Avant chaque déploiement