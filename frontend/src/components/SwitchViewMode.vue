<template>
  <div class="flex items-center justify-between gap-4 mb-4 no-print">
    <div
      class="inline-flex p-1 space-x-1 bg-gray-200 border border-gray-300 rounded-lg shadow-inner"
    >
      <button
        type="button"
        @click="$emit('setViewMode', 'report')"
        :class="[
          'flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition-all',
          currentViewMode === 'report'
            ? 'bg-white text-sky-700 shadow-sm'
            : 'text-gray-600 hover:text-gray-900',
        ]"
      >
        <Icon_report cusClass="w-4 h-4" />
        <span>Report </span>
      </button>

      <button
        :disabled="true"
        type="button"
        @click="$emit('setViewMode', 'chart')"
        :class="[
          'flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition-all disabled:cursor-not-allowed!',
          currentViewMode === 'chart'
            ? 'bg-white text-sky-700 shadow-sm'
            : 'text-gray-600 hover:text-gray-900',
        ]"
      >
        <Icon_chart cusClass="w-4 h-4" />
        <span>Graph</span>
      </button>
    </div>

    <!-- Current mode description badge -->
    <div class="hidden sm:flex items-center gap-2 text-xs text-gray-500">
      <span>Current mode:</span>
      <span
        class="px-2.5 py-1 font-semibold rounded-full bg-white border border-gray-300 text-sky-700"
      >
        {{ currentViewMode === 'report' ? 'Report' : 'Graph' }}
      </span>
    </div>
  </div>
</template>
<script setup>
import { defineProps, defineEmits } from 'vue'
import Icon_report from './icons/Icon_report.vue'
import Icon_chart from './icons/Icon_chart.vue'
defineProps({
  currentViewMode: {
    type: String,
    default: 'report',
  },
})
defineEmits(['setViewMode'])
</script>
