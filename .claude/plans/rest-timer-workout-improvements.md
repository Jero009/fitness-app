# Rest Timer & Workout Improvements Plan

## Context

The user requested four improvements to the workout experience:

1. **Add sound when rest timer stops** - Currently the timer silently disappears when complete
2. **Move rest timer bar to top of screen** - Currently positioned at bottom
3. **Fix rest timer stopping when navigating away** - Timer stops if user opens another page
4. **Fix workout sync timing** - User believes workout saves when closing tab, not when ending; should only save to history once when workout ends
5. **Add exercise reordering in workout** - Currently exercises can only be reordered in template editor, not during active workout

## Current State Analysis

### Rest Timer (WorkoutPage.vue:314-371)
- Timer uses `setInterval` that runs only when component is mounted
- When timer completes, it just calls `stopRestTimer()` - no audio notification
- Overlay positioned at `bottom: 0` with fixed positioning
- Timer state is lost when navigating away from WorkoutPage

### Workout Save Logic (gym_db.ts:725-735)
- Workout ONLY saves to history when user explicitly clicks "stop" button
- `endWorkout()` sets `time_end` and calculates `total_kg`
- No `beforeunload` or `visibilitychange` handlers exist
- Active workouts persist in DB with `time_end = NULL` and show on HomePage for resumption
- **The user's concern is already addressed** - workout only saves when "stop" is clicked

### Exercise Reordering
- TemplateEditorPage and TemplateBuilderPage use `vuedraggable` for reordering
- WorkoutPage has NO reordering functionality
- Database has `order_index` column in `workout_exercise` table
- Need to add `vuedraggable` and persist reordered `order_index`

## Implementation Plan

### 1. Sound Notification for Rest Timer

**File: `src/views/WorkoutPage.vue`**

- Create an audio utility using Web Audio API (no external files needed)
- Add a beep sound when timer completes
- Store audio context in a ref to persist across navigation

```typescript
// Add audio context and beep function
let audioContext: AudioContext | null = null;

const playBeep = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.frequency.value = 800;
  oscillator.type = 'sine';
  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
  
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.5);
};

// Call playBeep() when timer reaches 0
```

### 2. Move Rest Timer to Top of Screen

**File: `src/views/WorkoutPage.vue`**

- Change CSS from `bottom: 0` to `top: 0`
- Adjust border radius from top corners to bottom corners
- Adjust progress bar position from `bottom: 0` to `top: 0`
- Change `box-shadow` direction

```css
.rest-timer-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  /* ... keep other styles */
  border-top-left-radius: 0;
  border-top-right-radius: 0;
  border-bottom-left-radius: 16px;
  border-bottom-right-radius: 16px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.3);
}

.rest-progress-bar {
  position: absolute;
  top: 0;  /* was bottom: 0 */
  /* ... rest same */
}
```

### 3. Keep Rest Timer Running When Navigating Away

**Problem**: The rest timer is component-scoped and stops when leaving WorkoutPage.

**Solution**: Use sessionStorage to persist timer state across navigation.

- Store timer state (remaining, total, endTime) in sessionStorage when starting
- Check sessionStorage on component mount to resume timer if needed
- Use `visibilitychange` and `beforeunload` events to save state

```typescript
// Save timer state to sessionStorage
const saveTimerState = () => {
  if (restTimer.value.isActive) {
    sessionStorage.setItem('restTimer', JSON.stringify({
      remaining: restTimer.value.remaining,
      total: restTimer.value.total,
      endTime: Date.now() + (restTimer.value.remaining * 1000)
    }));
  }
};

// Restore timer state on mount
const restoreTimerState = () => {
  const saved = sessionStorage.getItem('restTimer');
  if (saved) {
    const { endTime } = JSON.parse(saved);
    const remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
    if (remaining > 0) {
      startRestTimer(remaining);
    } else {
      sessionStorage.removeItem('restTimer');
    }
  }
};
```

### 4. Workout Save Behavior (Already Correct)

**Finding**: After analysis, the workout save behavior is already correct:
- Workout ONLY saves to history when user clicks "stop" button (`endWorkout()`)
- No automatic save on tab close or navigation
- Workouts with `time_end = NULL` remain as "active workout" on HomePage

**Action**: No code changes needed. Inform user that behavior is already as expected.

### 5. Exercise Reordering in Workout

**File: `src/views/WorkoutPage.vue`**

- Import `Draggable` from `vuedraggable` (already used in template pages)
- Wrap exercise cards in `<Draggable>` component
- Add `@end` handler to persist new order to database
- Add CSS for drag feedback (`.sortable-chosen`)

**Database function to add (gym_db.ts)**:
```typescript
export async function updateWorkoutExerciseOrder(
  workoutId: number,
  exerciseIds: number[]
) {
  if (!db) return;
  for (let i = 0; i < exerciseIds.length; i++) {
    await db.run(
      'UPDATE workout_exercise SET order_index = ? WHERE workout_id = ? AND id = ?',
      [i + 1, workoutId, exerciseIds[i]]
    );
  }
}
```

**Template change**:
```vue
<Draggable 
  v-model="workoutExercises" 
  item-key="id"
  @end="onDragEnd"
  class="exercise-list"
>
  <template #item="{ element: ex }">
    <div class="exercise-sliding-item">
      <!-- existing exercise card -->
    </div>
  </template>
</Draggable>
```

## Files to Modify

| File | Changes |
|------|---------|
| `src/views/WorkoutPage.vue` | Add audio beep, move timer CSS to top, add sessionStorage persistence, add vuedraggable for reordering |
| `src/services/gym_db.ts` | Add `updateWorkoutExerciseOrder` function |

## Verification Steps

1. **Sound test**: Complete a set, wait for rest timer to finish - should hear beep
2. **Position test**: Rest timer overlay should appear at top of screen
3. **Navigation test**: Start rest timer, navigate to another tab/page, return - timer should still be running
4. **Save behavior test**: Start workout, close tab without clicking stop - workout should NOT appear in history, should show as active on return
5. **Reordering test**: Drag exercises to reorder in workout, verify order persists after refresh
