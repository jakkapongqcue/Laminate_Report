<template>
  <div class="p-4 mb-6 bg-white border border-gray-200 rounded-lg shadow-md no-print">
    <div class="flex flex-wrap items-end justify-between gap-4">
      <!-- Filter Controls Group -->
      <div class="grid w-full grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        <!-- Machine Selection -->
        <div class="class_InputGroup flex flex-col col-span-2">
          <label class="class_Lable">
            <Icon_machine />
            เครื่องจักร (Machine)
          </label>
          <div class="relative">
            <select
              id="Input_Machine"
              v-model="filters.machine"
              class="bg-white class_Input w-full"
              @click.ctrl.alt="$emit('refreshMachine')"
              @change="handleMachineChange()"
            >
              <option
                v-for="m in machines"
                :key="m.id"
                :value="m.id"
                :disabled="m.isMES === false"
                :class="{ 'text-gray-400 bg-gray-50': m.isMES === false }"
              >
                {{ m.name }}{{ m.isMES === false ? ' (No MES)' : '' }}
              </option>
            </select>
            <Pill_MachineStatus :machineStatus="machineStatus" />
          </div>
        </div>

        <!-- Item FG Component -->
        <Filter_ItemFG
          :filters="filters"
          :isCheckingItemFg="isCheckingItemFg"
          :itemFgStatus="itemFgStatus"
          :prodPools="prodPools"
          :itemFgSearchResults="itemFgSearchResults"
          @checkItemFGwithMachine="$emit('checkItemFGwithMachine')"
          @searchItemFGwithMachine="$emit('searchItemFGwithMachine')"
          @selectItemFgFromSearch="(item) => $emit('selectItemFgFromSearch', item)"
          @clearItemFgSearchResults="$emit('clearItemFgSearchResults')"
          @clearItemFgStatus="$emit('clearItemFgStatus')"
        />

        <!-- Date Range -->
        <div class="class_InputGroup flex flex-col self-end col-span-1 col-start-1">
          <label class="class_Lable">
            <Icon_calendar />
            วันที่เริ่มต้น
          </label>
          <input type="date" v-model="filters.date_from" class="class_Input" />
        </div>

        <!-- Time Range -->
        <div class="class_InputGroup flex flex-col self-end col-span-1">
          <label class="class_Lable">
            <Icon_time />
            เวลาม้วนแรกที่ทำการผลิต
          </label>
          <input type="time" v-model="filters.time_from" class="class_Input" />
        </div>

        <!-- Hourly Step (Visible on Report mode) -->
        <div class="class_InputGroup flex flex-col col-span-2 lg:col-span-1">
          <label class="class_Lable">
            <Icon_time />
            ช่วงเวลา (Step)
          </label>
          <select v-model.number="filters.hour_step" class="class_Input">
            <option :value="1">+1 ชั่วโมง</option>
            <option :value="2">+2 ชั่วโมง</option>
            <option :value="4">+4 ชั่วโมง</option>
          </select>
        </div>

        <div class="class_InputGroup flex flex-col col-span-1 col-start-1">
          <label class="class_Lable">
            <Icon_calendar />
            วันที่สิ้นสุด
          </label>
          <input type="date" v-model="filters.date_to" class="class_Input" />
        </div>

        <div class="class_InputGroup flex flex-col col-span-1">
          <label class="class_Lable">
            <Icon_time />
            เวลาสิ้นสุด
          </label>
          <input type="time" v-model="filters.time_to" class="class_Input" />
        </div>
      </div>

      <!-- Action Buttons -->
      <div
        class="grid grid-cols-2 md:flex items-center w-full gap-2 pt-3 text-xs text-gray-500 border-t border-gray-100"
      >
        <!-- Search button -->
        <button
          @click="$emit('search')"
          :disabled="statusLoading"
          :title="!filters.item_fg ? 'กรุณาระบุ Item FG ก่อนดึงข้อมูล' : ''"
          class="inline-flex justify-center items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium rounded-md shadow transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed w-full md:w-40"
        >
          <Icon_search :loading="statusLoading" :cusClass="'w-4 h-4'" />
          ดึงข้อมูล{{ currentViewMode === 'chart' ? 'กราฟ' : 'รายงาน' }}
        </button>

        <!-- Print / Export button (for Report mode) -->
        <button
          v-if="currentViewMode === 'report'"
          :disabled="!isHaveReportData"
          @click="$emit('print')"
          class="inline-flex justify-center items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-md shadow transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed w-full md:w-40"
        >
          <Icon_print />
          พิมพ์รายงาน
        </button>
      </div>
    </div>

    <!-- Presets bar -->
    <div class="flex items-center gap-2 pt-3 mt-3 text-xs text-gray-500 border-t border-gray-100">
      <span class="font-semibold text-gray-700">Quick Presets:</span>
      <button
        @click="setShift(1)"
        class="px-2 py-1 transition bg-gray-100 rounded hover:bg-sky-100 hover:text-sky-700 cursor-pointer"
      >
        กะเช้า (08:00 - 20:00)
      </button>
      <button
        @click="setShift(2)"
        class="px-2 py-1 transition bg-gray-100 rounded hover:bg-sky-100 hover:text-sky-700 cursor-pointer"
      >
        กะดึกข้ามวัน (20:00 - 08:00)
      </button>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, computed, ref } from 'vue'
import Icon_calendar from './icons/Icon_calendar.vue'
import Icon_time from './icons/Icon_time.vue'
import Icon_print from './icons/Icon_print.vue'
import Icon_search from './icons/Icon_search.vue'
import Icon_machine from './icons/Icon_machine.vue'

import Filter_ItemFG from '@/components/Filter_ItemFG.vue'
import Pill_MachineStatus from '@/components/Pill_MachineStatus.vue'

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
  currentViewMode: {
    type: String,
    default: 'report',
  },
  machineStatus: {
    type: Object,
    default: () => {
      return {
        status: 'Loading', // 'N/A', 'Online', 'Offline'
        time: '',
      }
    },
  },
  isHaveReportData: {
    type: Boolean,
    default: false,
  },
  isCheckingItemFg: {
    type: Boolean,
    default: false,
  },
  itemFgStatus: {
    type: Object,
    default: () => ({
      show: false,
      status: 'idle',
      text: '',
      message: '',
    }),
  },
  prodPools: {
    type: Array,
    default: () => [],
  },
  itemFgSearchResults: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits([
  'search',
  'print',
  'refreshMachine',
  'fetchMachineStatus',
  'checkItemFGwithMachine',
  'searchItemFGwithMachine',
  'selectItemFgFromSearch',
  'clearItemFgSearchResults',
  'clearItemFgStatus',
])

const setShift = (shiftNum) => {
  if (shiftNum === 1) {
    props.filters.time_from = '08:00'
    props.filters.time_to = '20:00'
  } else if (shiftNum === 2) {
    props.filters.time_from = '20:00'
    props.filters.time_to = '08:00'
  }
  emit('search')
}

const handleMachineChange = () => {
  emit('fetchMachineStatus')
  if (props.filters.item_fg && props.filters.item_fg.length > 3) {
    emit('checkItemFGwithMachine')
  }
}
</script>
