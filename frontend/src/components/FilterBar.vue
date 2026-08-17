<template>
  <div
    class="p-4 mb-6 bg-white border border-gray-200 rounded-lg shadow-md no-print"
  >
    <div class="flex flex-wrap items-end justify-between gap-4">
      <!-- Filter Controls Group -->
      <div class="flex flex-wrap items-end gap-4">
        <!-- Machine Selection -->
        <div class="flex flex-col">
          <label class="label">
            <Icon_machine />
            เครื่องจักร (Machine)
          </label>
          <select
            v-model="filters.machine"
            class="input bg-white min-w-[200px]"
          >
            <option v-for="m in machines" :key="m.id" :value="m.id">
              {{ m.name }}
            </option>
          </select>
        </div>

        <!-- Date Range -->
        <div class="flex flex-col">
          <label class="label">
            <Icon_calendar />
            วันที่เริ่มต้น (From Date)
          </label>
          <input type="date" v-model="filters.date_from" class="input" />
        </div>

        <div class="flex flex-col">
          <label class="label">
            <Icon_calendar />
            วันที่สิ้นสุด (To Date)
          </label>
          <input type="date" v-model="filters.date_to" class="input" />
        </div>

        <!-- Time Range -->
        <div class="flex flex-col">
          <label class="label">
            <Icon_time />
            เวลาเริ่มต้น (From Time)
          </label>
          <input type="time" v-model="filters.time_from" class="input" />
        </div>

        <div class="flex flex-col">
          <label class="label">
            <Icon_time />
            เวลาสิ้นสุด (To Time)
          </label>
          <input type="time" v-model="filters.time_to" class="input" />
        </div>

        <!-- Hourly Step -->
        <div class="flex flex-col">
          <label class="label">ช่วงเวลา (Step)</label>
          <select v-model.number="filters.hour_step" class="bg-white input">
            <option :value="1">+1 ชั่วโมง</option>
            <option :value="2">+2 ชั่วโมง</option>
            <option :value="4">+4 ชั่วโมง</option>
          </select>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex items-center gap-3">
        <!-- Search button -->
        <button
          @click="$emit('search')"
          :disabled="statusLoading"
          class="inline-flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium rounded-md shadow transition duration-150 ease-in-out disabled:opacity-50"
        >
          <Icon_search :loading="statusLoading" :cusClass="'w-4 h-4'" />
          ดึงข้อมูล
        </button>

        <!-- Print / Export button -->
        <button
          @click="$emit('print')"
          class="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-md shadow transition duration-150 ease-in-out"
        >
          <Icon_print />
          พิมพ์รายงาน / Export PDF
        </button>
      </div>

    </div>

    <!-- Presets bar -->
    <div
      class="flex items-center gap-2 pt-3 mt-3 text-xs text-gray-500 border-t border-gray-100"
    >
      <span class="font-semibold text-gray-700">Quick Presets:</span>
      <button
        @click="setShift(1)"
        class="px-2 py-1 transition bg-gray-100 rounded hover:bg-sky-100 hover:text-sky-700"
      >
        กะเช้า (08:00 - 20:00)
      </button>
      <button
        @click="setShift(2)"
        class="px-2 py-1 transition bg-gray-100 rounded hover:bg-sky-100 hover:text-sky-700"
      >
        กะดึกข้ามวัน (20:00 - 08:00)
      </button>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from "vue";
import Icon_calendar from "../components/icon/Icon_calendar.vue";
import Icon_time from "../components/icon/Icon_time.vue";
import Icon_print from "../components/icon/Icon_print.vue";
import Icon_search from "../components/icon/Icon_search.vue";
import Icon_machine from "../components/icon/Icon_machine.vue";
const props = defineProps({
  filters: {
    type: Object,
    required: true,
  },
  machines: {
    type: Array,
    default: () => [],
  },
  statusLoading: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["search", "print"]);

const setShift = (shiftNum) => {
  if (shiftNum === 1) {
    props.filters.time_from = "08:00";
    props.filters.time_to = "20:00";
  } else if (shiftNum === 2) {
    props.filters.time_from = "20:00";
    props.filters.time_to = "08:00";
  }
  emit("search");
};
</script>

<style lang="css" scoped>
.label {
  @apply text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1;
}
.input {
  @apply px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-sky-500;
}
</style>
