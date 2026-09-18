<template>
  <!-- Checking Pulse Dot -->
  <span
    v-if="translaterStatusIcon === 'idle'"
    class="w-2 h-2 rounded-full bg-sky-500 animate-pulse"
  >
  </span>
  <!-- Found Green Icon -->
  <svg
    v-else-if="translaterStatusIcon === 'checked'"
    class="w-3.5 h-3.5 text-emerald-600 shrink-0"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
  </svg>

  <!-- Not Found Red Icon -->
  <svg
    v-else-if="translaterStatusIcon === 'unchecked'"
    class="w-3.5 h-3.5 text-rose-600 shrink-0"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2.5"
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
</template>

<script setup>
import { defineProps, computed } from 'vue'

const props = defineProps({
  statusIcon: {
    type: String,
    default: 'idle',
  },
})

const translaterStatusIcon = computed(() => {
  if (props.statusIcon === 'checking') return 'idle'
  if (props.statusIcon === 'found') return 'checked'
  if (props.statusIcon === 'not_found') return 'unchecked'
})
</script>
