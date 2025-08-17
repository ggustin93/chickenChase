# Scénarios E2E Critiques - Chicken Chase

## Configuration Mobile
```javascript
// Viewport mobile optimisé pour le jeu
width: 768, height: 1024, deviceScaleFactor: 2, isMobile: true
```

## 1. Happy Path Complet

### Objectif
Vérifier le cycle de jeu complet : création → join → lancement par chicken

### Étapes
```javascript
// 1. Création de partie (Host)
await page.goto('/');
await page.click('[data-testid="create-game"]');
const gameCode = await page.textContent('[data-testid="game-code"]');

// 2. Join Player 2 (nouveau contexte browser)
const player2 = await browser.newContext();
await player2Page.goto('/');
await player2Page.click('[data-testid="join-game"]');
await player2Page.fill('[data-testid="join-code-input"]', gameCode);
await player2Page.fill('[data-testid="nickname-input"]', 'Hunter1');
await player2Page.click('[data-testid="join-submit"]');

// 3. Formation équipes
// Host rejoint équipe Chicken
await page.click('[data-testid="join-chicken-team"]');
// Player2 crée équipe Hunter
await player2Page.click('[data-testid="create-team"]');
await player2Page.fill('[data-testid="team-name-input"]', 'Hunters');

// 4. Lancement par Chicken (quand ≥1 équipe hunter)
await page.click('[data-testid="start-game"]');

// 5. Vérification redirections
await expect(page).toHaveURL(/\/chicken\/\w+/);
await expect(player2Page).toHaveURL(/\/player\/\w+/);
```

### Critères de Succès
- ✅ Code unique généré
- ✅ Sync temps réel lobby (Player2 visible pour Host)
- ✅ Chicken peut lancer uniquement si ≥1 équipe hunter
- ✅ Redirections automatiques correctes

## 2. Hunter - Complétion Challenge + Upload Photo

### Objectif  
Vérifier soumission challenge avec upload image par équipe Hunter

### Étapes
```javascript
// Setup: Hunter dans page de jeu
await hunterPage.goto(`/player/${gameId}`);
await hunterPage.click('[data-testid="challenges-tab"]');

// 1. Sélectionner challenge disponible
await hunterPage.click('[data-testid="challenge-item-0"]');
await hunterPage.click('[data-testid="submit-challenge"]');

// 2. Upload photo via camera modal
await hunterPage.click('[data-testid="camera-modal-trigger"]');

// Simuler upload image (mock file)
const fileInput = await hunterPage.locator('input[type="file"]');
await fileInput.setInputFiles('test-assets/proof-photo.jpg');

// 3. Confirmer soumission
await hunterPage.fill('[data-testid="challenge-description"]', 'Challenge completé!');
await hunterPage.click('[data-testid="submit-proof"]');

// 4. Vérifier statut "pending"
await expect(hunterPage.locator('[data-testid="challenge-status"]')).toContainText('En attente');
```

### Critères de Succès
- ✅ Upload image fonctionne
- ✅ Challenge passe en statut "pending" 
- ✅ Notification envoyée au Chicken

## 3. Chicken - Validation Challenge

### Objectif
Vérifier validation/rejet challenge par équipe Chicken

### Étapes  
```javascript
// Setup: Chicken reçoit notification challenge soumis
await chickenPage.goto(`/chicken/${gameId}`);

// 1. Voir notification nouveau challenge
await expect(chickenPage.locator('[data-testid="pending-challenges"]')).toBeVisible();
await chickenPage.click('[data-testid="review-challenges"]');

// 2. Examiner soumission
await chickenPage.click('[data-testid="challenge-submission-0"]');
await expect(chickenPage.locator('[data-testid="proof-image"]')).toBeVisible();

// 3a. Approuver challenge
await chickenPage.click('[data-testid="approve-challenge"]');
// OU 3b. Rejeter challenge  
// await chickenPage.click('[data-testid="reject-challenge"]');

// 4. Vérifier points attribués à l'équipe
await expect(chickenPage.locator('[data-testid="team-score"]')).toContainText('+50 points');
```

### Critères de Succès
- ✅ Notification temps réel reçue
- ✅ Photo visible dans interface validation
- ✅ Points correctement attribués après validation
- ✅ Hunter notifié du résultat

## 4. Chicken - Gestion Cagnotte

### Objectif
Vérifier gestion cagnotte par équipe Chicken (débit/crédit)

### Étapes
```javascript
// Setup: Chicken dans interface cagnotte
await chickenPage.goto(`/chicken/${gameId}`);
await chickenPage.click('[data-testid="cagnotte-tab"]');

// 1. Vérifier solde initial
const initialAmount = await chickenPage.textContent('[data-testid="cagnotte-amount"]');

// 2. Opération débit (achat bar)
await chickenPage.click('[data-testid="cagnotte-debit"]');
await chickenPage.click('[data-testid="preset-amount-20"]'); // 20€
await chickenPage.fill('[data-testid="description-input"]', 'Tournée bar central');
await chickenPage.click('[data-testid="confirm-transaction"]');

// 3. Vérifier mise à jour solde
const newAmount = await chickenPage.textContent('[data-testid="cagnotte-amount"]');
expect(parseFloat(newAmount)).toBe(parseFloat(initialAmount) - 20);

// 4. Vérifier historique transactions
await expect(chickenPage.locator('[data-testid="transaction-history"]')).toContainText('Tournée bar central');

// 5. Sync temps réel - Hunter voit mise à jour
await expect(hunterPage.locator('[data-testid="cagnotte-display"]')).toContainText(newAmount);
```

### Critères de Succès
- ✅ Opérations débit/crédit fonctionnelles
- ✅ Solde mis à jour en temps réel
- ✅ Historique transactions persistant
- ✅ Sync temps réel vers tous les joueurs

## 5. Test Transversal - Sync Temps Réel

### Objectif
Vérifier synchronisation temps réel entre tous les joueurs

### Étapes
```javascript
// Setup: 3 contextes browser (1 Chicken + 2 Hunters)
const contexts = await Promise.all([
  browser.newContext(), // Chicken
  browser.newContext(), // Hunter 1  
  browser.newContext()  // Hunter 2
]);

// Test sync événements critiques
// 1. Challenge soumis → Chicken notifié
// 2. Challenge validé → Hunter notifié + score équipe mis à jour
// 3. Cagnotte modifiée → Tous voient nouveau solde
// 4. Jeu terminé → Tous redirigés vers résultats

// Vérifier latence < 2 secondes pour chaque sync
```

## Utilitaires Test

### Setup Contexte Jeu
```javascript
async function setupGameContext() {
  const gameCode = await createGame();
  const hunterContext = await addHunterPlayer(gameCode);
  const chickenContext = await addChickenPlayer(gameCode);
  await startGame(chickenContext);
  
  return { gameCode, hunterContext, chickenContext };
}
```

### Nettoyage Données
```sql
DELETE FROM challenge_submissions WHERE created_at > NOW() - INTERVAL '1 hour';
DELETE FROM players WHERE nickname LIKE 'Test%';
DELETE FROM games WHERE created_at > NOW() - INTERVAL '1 hour';
```

## Métriques Critiques
- **Performance**: Chargement page < 3s sur 3G
- **Temps réel**: Latence sync < 2s  
- **Fiabilité**: 0% crash écran blanc
- **Mobile**: Interactions tactiles réactives