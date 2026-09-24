<template>
  <!-- overflow-auto so it scrolls on screen if needed, but is clipped for print -->
  <div class="w-full h-full">
    <table class="report-table">
      <thead>
        <tr>
          <!-- Column 1: Parameter name -->
          <th style="width: 230px; min-width: 230px">Setting Parameter</th>

          <!-- Column 2: Set Point -->
          <th style="width: 68px; min-width: 68px" class="font-bold">Set Point (PS)</th>

          <!-- Column 3: Diagonal Time / Unit header -->
          <th class="diagonal-cell" style="width: 48px; min-width: 48px; height: 36px">
            <div class="top-right-text">Time</div>
            <div class="bottom-left-text">Unit</div>
          </th>

          <!-- Dynamic time columns -->
          <th v-for="col in timeColumns" :key="col.key" class="font-bold text-center">
            <span class="whitespace-pre-wrap">{{ col.label }}</span>
          </th>

          <!-- Filler columns to always show 14 slots -->
          <th
            v-for="n in fillerColumnCount"
            :key="'fill-hdr-' + n"
            class=""
            style="min-width: 42px"
          >
            น.
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in rows" :key="row.param_id">
          <!-- Parameter Name -->
          <td class="font-medium param-name-cell">{{ row.name }}</td>

          <!-- Set Point -->
          <td class="font-medium text-center">{{ row.set_point }}</td>

          <!-- Unit -->
          <td class="text-center" style="font-size: 8.5px">
            {{ row.unit }}
          </td>

          <!-- Value cells for each time column -->
          <td
            v-for="col in timeColumns"
            :key="col.key"
            class="font-medium text-center"
            :class="getCellClass(row, col.key === 'setup' ? row.setup_val : row.values[col.key])"
          >
            <span v-if="col.key === 'setup'" class="w-full font-semibold text-center">{{
              row.setup_val
            }}</span>
            <span v-else>{{ row.values[col.key] || '' }}</span>
          </td>

          <!-- Filler cells -->
          <td v-for="n in fillerColumnCount" :key="'fill-cell-' + n" class="text-center"></td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  timeColumns: {
    type: Array,
    required: true,
    default: () => [],
  },
  rows: {
    type: Array,
    required: true,
    default: () => [],
  },
  targetColumnCount: {
    type: Number,
    default: 13,
  },
})

function parseRange(setPointStr) {
  if (!setPointStr || typeof setPointStr !== 'string') return null
  const cleaned = setPointStr.trim()
  if (!cleaned) return null

  // Matches "180-200", "180 - 200", "180~200"
  const rangeMatch = cleaned.match(/^(\d+(?:\.\d+)?)\s*[-~至ถึง]\s*(\d+(?:\.\d+)?)$/)
  if (rangeMatch) {
    const min = parseFloat(rangeMatch[1])
    const max = parseFloat(rangeMatch[2])
    return { min: Math.min(min, max), max: Math.max(min, max) }
  }

  // Matches single number e.g. "180"
  const singleMatch = cleaned.match(/^(\d+(?:\.\d+)?)$/)
  if (singleMatch) {
    const val = parseFloat(singleMatch[1])
    return { min: val, max: val }
  }

  return null
}

function getCellClass(row, rawVal) {
  // Only check for Line Speed
  if (!row || (row.key !== 'LINE_SPEED' && !row.name?.toLowerCase().includes('line speed'))) {
    return ''
  }

  if (rawVal === undefined || rawVal === null || String(rawVal).trim() === '') {
    return ''
  }

  const numVal = parseFloat(rawVal)
  if (isNaN(numVal)) {
    return ''
  }

  const range = parseRange(row.set_point)
  if (!range) {
    return ''
  }

  if (numVal < range.min || numVal > range.max) {
    return 'bg-red-100 text-red-600 font-bold'
  }

  return ''
}

const fillerColumnCount = computed(() => {
  // Exclude 'setup' column from counting toward the 14 visible time columns
  const nonSetupCols = props.timeColumns.filter((c) => c.key !== 'setup')
  const currentCount = nonSetupCols.length
  return currentCount < props.targetColumnCount ? props.targetColumnCount - currentCount : 0
})
</script>
