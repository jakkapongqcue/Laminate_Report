<template>
  <!-- overflow-auto so it scrolls on screen if needed, but is clipped for print -->
  <div class="w-full h-full">
    <table class="report-table">
      <thead>
        <tr>
          <!-- Column 1: Parameter name -->
          <th style="width: 160px; min-width: 160px">Setting Parameter</th>

          <!-- Column 2: Set Point -->
          <th style="width: 68px; min-width: 68px" class="font-bold bg-gray-50">
            Set Point (PS)
          </th>

          <!-- Column 3: Diagonal Time / Unit header -->
          <th
            class="diagonal-cell"
            style="width: 48px; min-width: 48px; height: 36px"
          >
            <div class="top-right-text">Time</div>
            <div class="bottom-left-text">Unit</div>
          </th>

          <!-- Dynamic time columns -->
          <th
            v-for="col in timeColumns"
            :key="col.key"
            class="font-bold text-center bg-gray-50"
            style="min-width: 42px"
          >
            {{ col.label }}
          </th>

          <!-- Filler columns to always show 14 slots -->
          <th
            v-for="n in fillerColumnCount"
            :key="'fill-hdr-' + n"
            class="bg-gray-50"
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
          <td class="text-center text-gray-700" style="font-size: 8.5px">
            {{ row.unit }}
          </td>

          <!-- Value cells for each time column -->
          <td
            v-for="col in timeColumns"
            :key="col.key"
            class="font-medium text-center"
          >
            <input
              v-if="col.key === 'setup'"
              v-model="row.setup_val"
              type="text"
              class="w-full font-semibold text-center bg-transparent focus:outline-none focus:bg-yellow-50"
              style="font-size: 8.5px"
            />
            <span v-else>{{ row.values[col.key] || "" }}</span>
          </td>

          <!-- Filler cells -->
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
import { computed } from "vue";

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
    default: 14
  }
});

const fillerColumnCount = computed(() => {
  const currentCount = props.timeColumns.length;
  return currentCount < props.targetColumnCount
    ? props.targetColumnCount - currentCount
    : 0;
});
</script>

<style scoped>
tr {
  height: 20px;
}
</style>
