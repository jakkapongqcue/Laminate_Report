<template>
  <div class="w-full overflow-x-auto">
    <table class="report-table">
      <thead>
        <tr>
          <!-- Fixed Column 1: Diagonal Header for Parameter Name vs Time -->
          <th class="diagonal-cell" style="width: 220px; height: 38px;">
            <div class="top-right-text">Time</div>
            <div class="bottom-left-text">Setting Parameter</div>
          </th>

          <!-- Fixed Column 2: Set Point -->
          <th style="width: 80px;" class="bg-gray-50 font-bold">
            Set Point (PS)
          </th>

          <!-- Fixed Column 3: Unit -->
          <th style="width: 70px;" class="bg-gray-50 font-bold">
            Unit
          </th>

          <!-- Dynamic Time Columns -->
          <th 
            v-for="col in timeColumns" 
            :key="col.key"
            style="min-width: 50px;"
            class="bg-gray-50 font-bold text-center"
          >
            {{ col.label }}
          </th>

          <!-- Empty filler header columns if page has fewer columns than 14 -->
          <th 
            v-for="n in fillerColumnCount" 
            :key="'fill-hdr-' + n"
            style="min-width: 45px;"
            class="bg-gray-50"
          >
            น.
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in rows" :key="row.param_id">
          <!-- Parameter Name -->
          <td class="param-name-cell font-medium">
            {{ row.name }}
          </td>

          <!-- Set Point -->
          <td class="text-center font-medium">
            {{ row.set_point }}
          </td>

          <!-- Unit -->
          <td class="text-center text-xs text-gray-700">
            {{ row.unit }}
          </td>

          <!-- Value Cells for Time Columns -->
          <td 
            v-for="col in timeColumns" 
            :key="col.key"
            class="text-center font-medium"
          >
            <input 
              v-if="col.key === 'setup'" 
              v-model="row.setup_val" 
              type="text"
              class="w-full text-center bg-transparent focus:outline-none focus:bg-yellow-50 text-xs font-semibold"
            />
            <span v-else>
              {{ row.values[col.key] || '' }}
            </span>
          </td>

          <!-- Empty filler cells for aesthetic symmetry when columns are less than target count -->
          <td 
            v-for="n in fillerColumnCount" 
            :key="'fill-cell-' + n"
            class="text-center"
          ></td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  timeColumns: {
    type: Array,
    required: true,
    default: () => []
  },
  rows: {
    type: Array,
    required: true,
    default: () => []
  },
  targetColumnCount: {
    type: Number,
    default: 14 // Standard company sheet has ~14 time slots
  }
})

// Calculate filler columns if the active timestamp columns count is less than 14
const fillerColumnCount = computed(() => {
  const currentCount = props.timeColumns.length
  return currentCount < props.targetColumnCount ? props.targetColumnCount - currentCount : 0
})
</script>
