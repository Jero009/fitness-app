<template>
  <div class="timer-dial-container">
    <div class="dial-header">
      <h2>Set Rest Time</h2>
      <p class="current-value">{{ value }}s</p>
    </div>

    <div class="dial-wrapper">
      <svg 
        class="dial-svg" 
        viewBox="0 0 300 300" 
        @mousedown="handleMouseDown"
        @mousemove="handleMouseMove" 
        @mouseleave="handleMouseLeave" 
        @mouseup="handleMouseUp"
        @touchstart="handleTouchStart"
        @touchmove="handleTouchMove"
        @touchend="handleTouchEnd"
      >
        <!-- Background circle -->
        <circle cx="150" cy="150" r="140" class="dial-bg" />
        
        <!-- Progress arc -->
        <circle 
          cx="150" 
          cy="150" 
          r="130" 
          class="dial-track"
          :style="{ strokeDasharray: `${arcLength} ${Math.PI * 260}` }"
        />

        <!-- Tick marks -->
        <g class="tick-marks">
          <g v-for="i in 12" :key="`tick-${i}`" :transform="`rotate(${(i-1) * 30} 150 150)`">
            <line x1="150" y1="25" x2="150" y2="35" class="tick" />
            <text x="150" y="50" class="tick-label">{{ (i-1) * 5 }}</text>
          </g>
        </g>

        <!-- Pointer/Handle -->
        <g :transform="`rotate(${rotation} 150 150)`">
          <circle 
            cx="150" 
            cy="30" 
            r="12" 
            class="pointer"
          />
        </g>
        
        <!-- Center circle -->
        <circle cx="150" cy="150" r="15" class="center-circle" />
      </svg>

      <!-- Number pad -->
      <div class="number-pad">
        <input 
          v-model.number="inputValue" 
          type="number" 
          min="1" 
          max="600"
          class="time-input"
          @change="updateFromInput"
          @keydown.enter="handleConfirm"
        >
        <span class="input-label">seconds</span>
      </div>
    </div>

    <div class="preset-buttons">
      <button 
        v-for="preset in presets" 
        :key="preset" 
        @click="value = preset"
        class="preset-btn"
        :class="{ active: value === preset }"
      >
        {{ preset }}s
      </button>
    </div>

    <div class="dial-actions">
      <ion-button fill="outline" @click="handleCancel" class="btn-cancel">
        Cancel
      </ion-button>
      <ion-button fill="solid" @click="handleConfirm" class="btn-confirm">
        Confirm
      </ion-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { IonButton, modalController } from '@ionic/vue';

interface Props {
  initialValue?: number;
}

const props = withDefaults(defineProps<Props>(), {
  initialValue: 60
});

const value = ref(props.initialValue);
const inputValue = ref(props.initialValue);
const isDragging = ref(false);
const presets = [15, 30, 45, 60, 90, 120];

const handleConfirm = async () => {
  await modalController.dismiss(value.value, 'confirm');
};

const handleCancel = async () => {
  await modalController.dismiss(undefined, 'cancel');
};

const rotation = computed(() => {
  // Map 1-600 seconds to 0-360 degrees
  return (value.value / 600) * 360;
});

const arcLength = computed(() => {
  // Calculate the arc length for the progress circle
  // SVG circle with r=130, circumference = 2π * 130 ≈ 816.8
  return (value.value / 600) * (Math.PI * 260);
});

const handleMouseDown = () => {
  isDragging.value = true;
};

const handleMouseMove = (event: MouseEvent) => {
  if (!isDragging.value) return;
  event.preventDefault();
  event.stopPropagation();

  const svg = event.currentTarget as SVGElement;
  updateWheelValue(svg, event.clientX, event.clientY);
};

const handleMouseUp = () => {
  isDragging.value = false;
};

const handleMouseLeave = () => {
  isDragging.value = false;
};

const handleTouchStart = (event: TouchEvent) => {
  if (event.touches.length > 0) {
    isDragging.value = true;
    event.preventDefault();
    event.stopPropagation();
  }
};

const handleTouchMove = (event: TouchEvent) => {
  if (!isDragging.value || event.touches.length === 0) return;
  event.preventDefault();
  event.stopPropagation();

  const svg = event.currentTarget as SVGElement;
  const touch = event.touches[0];
  updateWheelValue(svg, touch.clientX, touch.clientY);
};

const handleTouchEnd = (event: TouchEvent) => {
  isDragging.value = false;
  event.preventDefault();
  event.stopPropagation();
};

const updateWheelValue = (svg: SVGElement, clientX: number, clientY: number) => {
  const rect = svg.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  const x = clientX - centerX;
  const y = clientY - centerY;

  // Calculate angle from center
  let angle = Math.atan2(y, x) * (180 / Math.PI);
  // Convert so 0 degrees is at top (12 o'clock)
  angle = (angle + 90 + 360) % 360;

  // Map angle (0-360) to seconds (1-600)
  const newValue = Math.round((angle / 360) * 600);
  value.value = Math.max(1, Math.min(600, newValue));
  inputValue.value = value.value;
};

const updateFromInput = () => {
  const numValue = Math.max(1, Math.min(600, inputValue.value || 1));
  value.value = numValue;
  inputValue.value = numValue;
};

watch(() => props.initialValue, (newValue) => {
  value.value = newValue;
  inputValue.value = newValue;
});

defineExpose({
  getValue: () => value.value
});
</script>

<style scoped>
.timer-dial-container {
  padding: 20px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02));
  border-radius: 16px;
  color: var(--ion-color-light);
  display: flex;
  flex-direction: column;
  gap: 24px;
  touch-action: none;
  overflow: hidden;
}

.dial-header {
  text-align: center;
}

.dial-header h2 {
  margin: 0;
  font-size: 1.4rem;
  font-weight: 600;
  color: var(--ion-color-light);
}

.current-value {
  margin: 8px 0 0 0;
  font-size: 2rem;
  font-family: 'Doto', sans-serif;
  font-weight: bold;
  color: var(--ion-color-accent-yellow);
}

.dial-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  touch-action: none;
}

.dial-svg {
  width: 280px;
  height: 280px;
  cursor: grab;
  user-select: none;
  touch-action: none;
  pointer-events: auto;
  display: block;
}

.dial-svg:active {
  cursor: grabbing;
}

.dial-bg {
  fill: rgba(255, 255, 255, 0.04);
  stroke: rgba(255, 255, 255, 0.12);
  stroke-width: 2;
}

.dial-track {
  fill: none;
  stroke: var(--ion-color-accent-yellow);
  stroke-width: 6;
  stroke-linecap: round;
  transform-origin: 150px 150px;
  transform: rotate(-90deg);
  transition: stroke-dasharray 0.1s ease;
}

.tick-marks {
  pointer-events: none;
}

.tick {
  stroke: rgba(255, 255, 255, 0.3);
  stroke-width: 1.5;
}

.tick-label {
  text-anchor: middle;
  dominant-baseline: middle;
  font-size: 10px;
  fill: rgba(255, 255, 255, 0.6);
  font-weight: 500;
}

.pointer {
  fill: var(--ion-color-accent-yellow);
  stroke: rgba(255, 255, 255, 0.2);
  stroke-width: 2;
  cursor: grab;
  box-shadow: 0 0 8px rgba(255, 195, 0, 0.3);
  transition: filter 0.1s ease;
}

.pointer:hover {
  filter: brightness(1.2);
}

.center-circle {
  fill: rgba(255, 255, 255, 0.15);
  stroke: rgba(255, 255, 255, 0.2);
  stroke-width: 1;
}

.number-pad {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.06);
  padding: 12px 16px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.time-input {
  width: 80px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  padding: 8px 12px;
  color: var(--ion-color-light);
  font-size: 1.2rem;
  font-weight: bold;
  text-align: center;
  font-family: 'Doto', sans-serif;
}

.time-input:focus {
  outline: none;
  border-color: var(--ion-color-accent-yellow);
  background: rgba(255, 255, 255, 0.12);
}

.time-input::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

.input-label {
  font-size: 0.9rem;
  opacity: 0.8;
}

.preset-buttons {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.preset-btn {
  padding: 10px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  color: var(--ion-color-light);
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.preset-btn:hover {
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(255, 255, 255, 0.2);
}

.preset-btn.active {
  background: var(--ion-color-accent-yellow);
  border-color: var(--ion-color-accent-yellow);
  color: var(--ion-color-dark);
  font-weight: 700;
}

.dial-actions {
  display: flex;
  gap: 12px;
}

.btn-cancel,
.btn-confirm {
  flex: 1;
  --border-radius: 8px;
  font-weight: 600;
}

.btn-cancel {
  --background: rgba(255, 255, 255, 0.08);
  --border-color: rgba(255, 255, 255, 0.12);
}

.btn-confirm {
  --background: var(--ion-color-accent-yellow);
  --color: var(--ion-color-dark);
}

/* Input number controls styling */
.time-input::-webkit-outer-spin-button,
.time-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.time-input[type='number'] {
  -moz-appearance: textfield;
}
</style>
