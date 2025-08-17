# Real-time Supabase Architecture

## Overview

Implementation of a robust real-time cagnotte (pot/kitty) system using Supabase Realtime with optimistic updates for instant UI feedback. This system ensures synchronized data across all players while providing immediate user experience for the chicken team.

## Problem Solved

**Original Issue**: Cagnotte UI only updated when switching tabs, not in real-time during operations.

**Root Causes Identified**:
1. Multiple hooks with conflicting Realtime subscriptions
2. Components mounting/unmounting on tab changes
3. Subscription setup only triggered during component lifecycle
4. State management conflicts between different cagnotte hooks

## Architecture Solution

### Core Components

#### 1. `useRealtimeCagnotte` Hook
**Location**: `src/hooks/useRealtimeCagnotte.ts`

**Purpose**: Central hook for real-time cagnotte management with persistent subscriptions.

**Key Features**:
- **Persistent Subscriptions**: Maintains active WebSocket connections regardless of UI state
- **Optimistic Updates**: Immediate UI feedback with server confirmation
- **Error Recovery**: Automatic rollback on operation failures
- **Debug Logging**: Comprehensive logging for troubleshooting

```typescript
interface UseRealtimeCagnotteResult {
  current: number; // Amount in cents
  initial: number; // Initial amount in cents
  loading: boolean;
  error: string | null;
  lastUpdate?: string;
  updateCagnotte: (operation: 'add' | 'subtract' | 'set', amount: number, reason?: string) => Promise<any>;
  resetCagnotte: () => Promise<any>;
  quickOperation: (operation: string) => Promise<any>;
  transactions: CagnotteTransaction[];
}
```

#### 2. Supabase Realtime Configuration

**Channel Naming**: `game-cagnotte-${gameId}`
- Unique per game to avoid cross-contamination
- Descriptive naming for debugging

**Subscription Strategy**:
```typescript
// 1️⃣ Listen to games table updates (cagnotte_current changes)
gameChannel.on('postgres_changes', {
  event: 'UPDATE',
  schema: 'public', 
  table: 'games',
  filter: `id=eq.${gameId}`
}, handleCagnotteUpdate);

// 2️⃣ Listen to transaction log insertions
gameChannel.on('postgres_changes', {
  event: 'INSERT',
  schema: 'public',
  table: 'cagnotte_transactions', 
  filter: `game_id=eq.${gameId}`
}, handleTransactionInsert);
```

#### 3. Database Integration

**RPC Functions Used**:
- `quick_cagnotte_operation(p_game_id, p_preset_operation, p_player_id)`
- `update_cagnotte(p_game_id, p_operation, p_amount_cents, p_player_id, p_reason)`

**Preset Operations Available**:
- `spend_5`, `spend_10`, `spend_15`, `spend_20`, `spend_30`, `spend_50`
- `add_5`, `add_10`, `add_20`
- `subtract_5`, `subtract_10`, `subtract_20`
- `reset`

**Database Tables Involved**:
- `games` table: `cagnotte_current`, `cagnotte_initial` columns
- `cagnotte_transactions` table: Complete audit trail
- `game_events` table: Event broadcasting for complex scenarios

## Implementation Patterns

### 1. Parent-Level Hook Pattern

**Problem**: Hooks in child components get destroyed on tab changes.

**Solution**: Move `useRealtimeCagnotte` to parent component (`ChickenPage`) and pass data via props.

```typescript
// ChickenPage.tsx - Parent Level
const {
  current: cagnotteCurrentCents,
  loading: cagnotteLoading,
  error: cagnotteError,
  quickOperation
} = useRealtimeCagnotte(gameId);

// SimpleCagnotteActions.tsx - Child Component
interface SimpleCagnotteActionsProps {
  currentAmount: number;
  loading: boolean;
  error: string | null;
  quickOperation: (operation: string) => Promise<any>;
}
```

### 2. Optimistic Updates Pattern

**Concept**: Update UI immediately, then confirm with server response.

**Implementation Flow**:
```typescript
const quickOperation = async (operation: string) => {
  // 1. Calculate expected result
  const currentAmount = state.current;
  const estimatedNewAmount = calculateNewAmount(currentAmount, operation);
  
  // 2. Update UI immediately (optimistic)
  setState(prev => ({ ...prev, current: estimatedNewAmount }));
  
  try {
    // 3. Execute server operation
    const result = await supabase.rpc('quick_cagnotte_operation', params);
    
    // 4. Correct any discrepancies with real server value
    if (result.new_amount !== estimatedNewAmount) {
      setState(prev => ({ ...prev, current: result.new_amount }));
    }
  } catch (error) {
    // 5. Rollback on error
    setState(prev => ({ ...prev, current: currentAmount }));
    throw error;
  }
};
```

### 3. Conflict Resolution Pattern

**Problem**: Multiple hooks trying to manage same data.

**Solution**: Single source of truth with clear ownership.

- `ChickenPage`: Owns cagnotte state with modification rights
- `PlayerGameStatusCard`: Read-only display via separate hook instance
- `SimpleCagnotteActions`: Receives data via props, no independent state

## Technical Benefits

### 1. Performance Improvements
- **Immediate UI Response**: 0ms perceived latency for user actions
- **Reduced Server Load**: Optimistic updates reduce apparent response time
- **Efficient Subscriptions**: Single persistent connection per game

### 2. User Experience
- **Instant Feedback**: Users see changes immediately
- **Consistent State**: All players see synchronized data
- **Error Recovery**: Graceful handling of network/server issues

### 3. Developer Experience
- **Comprehensive Logging**: Debug-friendly with detailed console outputs
- **Type Safety**: Full TypeScript support with proper interfaces
- **Testable Architecture**: Clear separation of concerns

## Debug and Monitoring

### Console Logging Pattern
```typescript
console.log('🚀 useRealtimeCagnotte: Setting up for game:', gameId);
console.log('📡 Creating channel:', channelName);
console.log('✅ Successfully subscribed to cagnotte updates');
console.log('⚡ Optimistic update:', currentAmount, '→', estimatedNewAmount);
console.log('🔄 Game cagnotte update received:', payload);
console.log('🔄 Updating state from', prev.current, 'to', newState.current);
```

### Subscription Status Monitoring
```typescript
gameChannel.subscribe((status) => {
  if (status === 'SUBSCRIBED') {
    console.log('✅ Successfully subscribed to cagnotte updates');
  } else if (status === 'CLOSED') {
    console.log('❌ Cagnotte subscription closed');
  } else if (status === 'CHANNEL_ERROR') {
    console.log('🚨 Channel error in cagnotte subscription');
  }
});
```

## Testing Strategy

### Manual Testing Checklist
1. **Immediate UI Update**: Click action → UI changes instantly
2. **Cross-Client Sync**: Other players see changes in real-time
3. **Error Recovery**: Network issues → UI rolls back gracefully
4. **Tab Switching**: Changes persist across tab navigation
5. **Connection Recovery**: Reconnection after network interruption

### Debug Console Verification
- Subscription establishment logs
- Optimistic update calculations
- Server confirmation messages
- Error handling and rollback logs

## Future Enhancements

### Potential Improvements
1. **Conflict Resolution**: Handle simultaneous operations from multiple chicken team members
2. **Offline Support**: Queue operations during network outages
3. **Animation Feedback**: Smooth transitions for amount changes
4. **Advanced Rollback**: More sophisticated error recovery strategies

### Monitoring Additions
1. **Performance Metrics**: Track response times and success rates
2. **Connection Health**: Monitor WebSocket connection stability
3. **User Analytics**: Track usage patterns and optimization opportunities

## File Structure

```
src/
├── hooks/
│   ├── useRealtimeCagnotte.ts          # Main real-time hook
│   └── useCagnotteManagement.ts        # Legacy hook (deprecated)
├── components/
│   ├── cagnotte/
│   │   └── SimpleCagnotteActions.tsx   # Updated to use props
│   └── player/
│       └── PlayerGameStatusCard.tsx    # Read-only display
├── pages/
│   ├── ChickenPage.tsx                 # Parent-level hook usage
│   └── PlayerPage.tsx                  # Cleaned up legacy usage
└── services/
    └── cagnotteService.ts              # Legacy service layer
```

## Migration Notes

### Breaking Changes
- `SimpleCagnotteActions` now requires props instead of using internal hook
- `useCagnotteManagement` hook deprecated in favor of `useRealtimeCagnotte`
- Channel naming changed from `cagnotte-updates-${gameId}` to `game-cagnotte-${gameId}`

### Backward Compatibility
- Database RPC functions remain unchanged
- Component interfaces updated but functionality preserved
- All existing preset operations continue to work

This architecture provides a solid foundation for real-time features throughout the application and can be extended to other data synchronization needs.