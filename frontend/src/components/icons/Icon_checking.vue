<template>
  <svg
    v-if="isChecking"
    :cusClass="cusClass"
    class="w-3.5 h-3.5 animate-spin"
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <circle
      class="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      stroke-width="4"
    ></circle>
    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
  </svg>

  <svg
    v-else
    :cusClass="cusClass"
    xmlns="http://www.w3.org/2000/svg"
    class="w-3.5 h-3.5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2"
      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
</template>

<script setup>
const props = defineProps({
  isChecking: {
    type: Boolean,
    default: false,
  },
  cusClass: {
    type: String,
    default: '',
  },
})
</script>
