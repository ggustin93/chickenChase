# PlayerGameStatusCard Cagnotte Integration Test

## Test Date: 2025-01-31

### Changes Made
1. Integrated `useCagnotteManagement` hook in PlayerPage to fetch real-time cagnotte data from Supabase
2. Replaced mock cagnotte state with real data from the database
3. Updated MapTab component to receive real cagnotte amounts and loading state
4. Modified handleCagnotteConsumption to show warning for hunters (read-only access)

### What Was Changed

#### PlayerPage.tsx
- Added import for `useCagnotteManagement` hook
- Replaced mock cagnotte state with:
  ```typescript
  const { 
    currentAmount: cagnotteCurrentCents,
    stats: cagnotteStats,
    loading: cagnotteLoading,
    error: cagnotteError,
    centsToEuros
  } = useCagnotteManagement({
    gameId: session?.gameId || '',
    enableRealtime: true
  });
  ```
- Converted cents to euros for display
- Updated MapTab props to pass real cagnotte loading state

### Expected Behavior
1. PlayerGameStatusCard should display real cagnotte amounts from Supabase
2. Cagnotte amounts should update in real-time when changed
3. Loading state should be properly reflected
4. Hunters should see read-only cagnotte info (no ability to consume)

### Test Steps
1. Create a game with initial cagnotte amount
2. Join as a hunter team
3. Navigate to the player page
4. Verify cagnotte amount is displayed correctly in PlayerGameStatusCard
5. Have chicken team consume some cagnotte
6. Verify hunter view updates in real-time

### Notes
- The cagnotte data is stored in cents in the database (cagnotte_initial, cagnotte_current)
- The hook handles real-time subscriptions automatically
- Conversion from cents to euros is handled by the hook's centsToEuros utility