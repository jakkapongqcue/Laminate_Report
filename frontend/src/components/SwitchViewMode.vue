<template>
  <div class="no-print mb-4 flex items-center justify-between gap-4">
    <div role="tablist" aria-label="โหมดการแสดงผล" class="inline-flex space-x-1 rounded-lg border border-gray-300 bg-gray-200 p-1 shadow-inner">
      <button
        type="button"
        role="tab"
        aria-controls="report-panel"
        @click="$emit('setViewMode', 'report')"
        :aria-selected="currentViewMode === 'report'"
        :class="[
          'flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-all',
          currentViewMode === 'report' ? 'bg-white text-sky-700 shadow-sm' : 'text-gray-700 hover:text-gray-900',
        ]"
      >
        <Icon_report cusClass="w-4 h-4" />
        <span>Report </span>
      </button>

      <button
        type="button"
        role="tab"
        aria-controls="chart-panel"
        @click="$emit('setViewMode', 'chart')"
        :aria-selected="currentViewMode === 'chart'"
        :class="[
          'flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-all disabled:cursor-not-allowed!',
          currentViewMode === 'chart' ? 'bg-white text-sky-700 shadow-sm' : 'text-gray-700 hover:text-gray-900',
        ]"
      >
        <Icon_chart cusClass="w-4 h-4" />
        <span>Graph</span>
      </button>
    </div>

    <!-- Current mode description badge -->
    <div class="hidden items-center gap-2 text-xs text-gray-600 sm:flex">
      <span>Current mode:</span>
      <span class="rounded-full border border-gray-300 bg-white px-2.5 py-1 font-semibold text-sky-700">
        {{ currentViewMode === "report" ? "Report" : "Graph" }}
      </span>
    </div>
  </div>
</template>
<script setup>
import { defineProps, defineEmits } from "vue"
import Icon_report from "./icons/Icon_report.vue"
import Icon_chart from "./icons/Icon_chart.vue"
defineProps({
  currentViewMode: {
    type: String,
    default: "report",
  },
})
defineEmits(["setViewMode"])
</script>
