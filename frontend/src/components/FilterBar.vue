<template>
  <div
    class="no-print bg-white rounded-lg shadow-md p-4 mb-6 border border-gray-200"
  >
    <div class="flex flex-wrap items-end gap-4 justify-between">
      <!-- Filter Controls Group -->
      <div class="flex flex-wrap items-end gap-4">
        <!-- Machine Selection -->
        <div class="flex flex-col">
          <label
            class="text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1"
          >
            <svg
              class="w-4 h-4 text-sky-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              ></path>
            </svg>
            เครื่องจักร (Machine)
          </label>
          <select
            v-model="filters.machine"
            class="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white min-w-[200px]"
          >
            <option v-for="m in machines" :key="m.id" :value="m.name">
              {{ m.name }}
            </option>
          </select>
        </div>

        <!-- Date Range -->
        <div class="flex flex-col">
          <label
            class="text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1"
          >
            <Icon_calendar />
            วันที่เริ่มต้น (From Date)
          </label>
          <input
            type="date"
            v-model="filters.date_from"
            class="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <div class="flex flex-col">
          <label
            class="text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1"
          >
            <Icon_calendar />
            วันที่สิ้นสุด (To Date)
          </label>
          <input
            type="date"
            v-model="filters.date_to"
            class="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <!-- Time Range -->
        <div class="flex flex-col">
          <label
            class="text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1"
          >
            <Icon_time />
            เวลาเริ่มต้น (From Time)
          </label>
          <input
            type="time"
            v-model="filters.time_from"
            class="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <div class="flex flex-col">
          <label
            class="text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1"
          >
            <Icon_time />
            เวลาสิ้นสุด (To Time)
          </label>
          <input
            type="time"
            v-model="filters.time_to"
            class="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <!-- Hourly Step -->
        <div class="flex flex-col">
          <label class="text-xs font-semibold text-gray-700 mb-1"
            >ช่วงเวลา (Step)</label
          >
          <select
            v-model.number="filters.hour_step"
            class="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
          >
            <option :value="1">+1 ชั่วโมง (Default)</option>
            <option :value="2">+2 ชั่วโมง</option>
            <option :value="4">+4 ชั่วโมง</option>
          </select>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex items-center gap-3">
        <button
          @click="$emit('search')"
          :disabled="loading"
          class="inline-flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium rounded-md shadow transition duration-150 ease-in-out disabled:opacity-50"
        >
          <Icon_Loading :loading="loading" :cusClass="'w-4 h-4'" />
          ดึงข้อมูล
        </button>

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
      class="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2 text-xs text-gray-500"
    >
      <span class="font-semibold text-gray-700">Quick Presets:</span>
      <button
        @click="setShift(1)"
        class="px-2 py-1 bg-gray-100 hover:bg-sky-100 hover:text-sky-700 rounded transition"
      >
        กะเช้า (08:00 - 20:00)
      </button>
      <button
        @click="setShift(2)"
        class="px-2 py-1 bg-gray-100 hover:bg-sky-100 hover:text-sky-700 rounded transition"
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
import Icon_Loading from "../components/icon/Icon_Loading.vue";

const props = defineProps({
  filters: {
    type: Object,
    required: true,
  },
  machines: {
    type: Array,
    default: () => [],
  },
  loading: {
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
