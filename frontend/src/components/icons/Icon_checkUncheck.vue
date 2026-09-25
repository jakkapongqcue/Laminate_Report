<template>
  <!-- Checking Pulse Dot -->
  <span
    v-if="translaterStatusIcon === 'idle'"
    class="h-2 w-2 animate-pulse rounded-full bg-sky-500"
  >
  </span>
  <!-- Found Green Icon -->
  <svg
    aria-hidden="true"
    v-else-if="translaterStatusIcon === 'checked'"
    class="h-3.5 w-3.5 shrink-0 text-emerald-600"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2.5"
      d="M5 13l4 4L19 7"
    />
  </svg>

  <!-- Not Found Red Icon -->
  <svg
    aria-hidden="true"
    v-else-if="translaterStatusIcon === 'unchecked'"
    class="h-3.5 w-3.5 shrink-0 text-rose-600"
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
import { defineProps, computed } from "vue"

const props = defineProps({
  statusIcon: {
    type: String,
    default: "idle",
  },
})

const translaterStatusIcon = computed(() => {
  if (props.statusIcon === "checking") return "idle"
  if (props.statusIcon === "found") return "checked"
  if (props.statusIcon === "not_found") return "unchecked"
})
</script>
