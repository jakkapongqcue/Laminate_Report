<template>
  <div class="p-4 mb-6 bg-white border border-gray-200 rounded-lg shadow-md no-print">
    <div class="flex flex-wrap items-end justify-between gap-4">
      <!-- Filter Controls Group -->
      <div class="grid w-full grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        <!-- Machine Selection -->
        <div class="flex flex-col col-span-2 relative">
          <label class="class_Lable">
            <Icon_machine />
            เครื่องจักร (Machine)
          </label>
          <select
            id="Input_Machine"
            v-model="filters.machine"
            class="bg-white class_Input"
            @click.ctrl.alt="$emit('refreshMachine')"
            @change="fetchMachineStatus()"
          >
            <option v-for="m in machines" :key="m.id" :value="m.id">
              {{ m.name }}
            </option>
          </select>
          <div
            :title="machineStatus_time"
            @mouseover="machineStatus_refreshTime()"
            @click="focusMachineSelect()"
            class="absolute top-1/2 translate-y-[-45%] right-10"
          >
            <span
              class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border select-none transition-all"
              :class="machineStatus_pillClass"
            >
              <span class="w-2 h-2 rounded-full animate-pulse" :class="machineStatus_lightClass">
              </span>
              {{ machineStatus_text }}
            </span>
          </div>
        </div>

        <!-- Hourly Step -->
        <div class="flex flex-col col-span-1">
          <label class="class_Lable"> <Icon_time />ช่วงเวลา (Step)</label>
          <select v-model.number="filters.hour_step" class="class_Input">
            <option :value="1">+1 ชั่วโมง</option>
            <option :value="2">+2 ชั่วโมง</option>
            <option :value="4">+4 ชั่วโมง</option>
          </select>
        </div>

        <!-- Date Range -->
        <div class="flex flex-col self-end col-span-1 col-start-1">
          <label class="class_Lable">
            <Icon_calendar />
            วันที่เริ่มต้น (From Date)
          </label>
          <input type="date" v-model="filters.date_from" class="class_Input" />
        </div>

        <!-- Time Range -->
        <div class="flex flex-col self-end col-span-1">
          <label class="class_Lable">
            <Icon_time />
            เวลาเริ่มต้น (From Time)
          </label>
          <input type="time" v-model="filters.time_from" class="class_Input" />
        </div>

        <!-- Setup filter: date and time -->
        <div class="flex flex-col self-end col-span-1" v-if="false">
          <label class="class_Lable">
            <Icon_calendar />
            วันสำหรับ Set up (Setup Date)
          </label>
          <input type="date" v-model="filters.setup_date" class="class_Input" />
        </div>

        <div class="relative flex flex-col self-end col-span-1">
          <label class="class_Lable">
            <Icon_time />
            เวลา Set up (Setup Time)
          </label>
          <input type="time" v-model="filters.setup_time" class="class_Input" />
          <!-- คำเตือน: กรุณาเลือกเวลา Set up -->
          <span
            class="absolute text-xs text-red-500 transition-opacity -bottom-1"
            :class="[filters.setup_time ? 'opacity-0' : 'opacity-100']"
            >คำเตือน: กรุณาเลือกเวลา Set up
          </span>
        </div>

        <div class="flex flex-col col-span-1 col-start-1">
          <label class="class_Lable">
            <Icon_calendar />
            วันที่สิ้นสุด (To Date)
          </label>
          <input type="date" v-model="filters.date_to" class="class_Input" />
        </div>

        <div class="flex flex-col col-span-1">
          <label class="class_Lable">
            <Icon_time />
            เวลาสิ้นสุด (To Time)
          </label>
          <input type="time" v-model="filters.time_to" class="class_Input" />
        </div>
      </div>

      <!-- Action Buttons -->
      <div
        class="flex items-center w-full gap-3 pt-3 text-xs text-gray-500 border-t border-gray-100"
      >
        <!-- Search button -->
        <button
          @click="$emit('search')"
          :disabled="statusLoading || !filters.setup_time"
          class="inline-flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium rounded-md shadow transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
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
    <div class="flex items-center gap-2 pt-3 mt-3 text-xs text-gray-500 border-t border-gray-100">
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
import { defineProps, defineEmits, computed, ref } from 'vue'
import Icon_calendar from './icons/Icon_calendar.vue'
import Icon_time from './icons/Icon_time.vue'
import Icon_print from './icons/Icon_print.vue'
import Icon_search from './icons/Icon_search.vue'
import Icon_machine from './icons/Icon_machine.vue'
import { timeAgo } from '@/utils/timeAgo'
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
  machineStatus: {
    type: Object,
    default: () => {
      return {
        status: 'Loading', // 'N/A', 'Online', 'Offline'
        time: '',
      }
    },
  },
})

const emit = defineEmits(['search', 'print'])
const getTodayStr = (nDay = 0) => {
  const d = new Date()
  d.setDate(d.getDate() + nDay)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const setShift = (shiftNum) => {
  if (shiftNum === 1) {
    props.filters.time_from = '08:00'
    props.filters.time_to = '20:00'
  } else if (shiftNum === 2) {
    // props.filters.date_from = getTodayStr(-1);
    // props.filters.date_to = getTodayStr();
    props.filters.time_from = '20:00'
    props.filters.time_to = '08:00'
  }
  emit('search')
}

const fetchMachineStatus = async () => {
  await emit('fetchMachineStatus')
}

const focusMachineSelect = () => {
  const Input_Machine = document.getElementById('Input_Machine')
  Input_Machine.showPicker()
  Input_Machine.focus()
}

const machineStatus_pillClass = computed(() => {
  switch (props.machineStatus.status) {
    case 'Error':
      return 'bg-red-300 text-red-950 border-red-300 duration-300'
    case 'Loading':
      return '!border-none text-gray-500 animate-pulse'
    case 'Online':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200 duration-300'
    case 'Offline':
      return 'bg-red-200 text-red-950 border-red-300 duration-300'
    default:
      return 'opacity-0 duration-1000'
  }
})

const machineStatus_lightClass = computed(() => {
  switch (props.machineStatus.status) {
    case 'Error':
      return 'bg-red-500'
    case 'Loading':
      return '' //bg-gray-500
    case 'Online':
      return 'bg-emerald-500'
    case 'Offline':
      return 'bg-red-500'
    default:
      return ''
  }
})

const machineStatus_text = computed(() => {
  switch (props.machineStatus.status) {
    case 'Error':
      return 'Error'
    case 'Loading':
      return 'Status...'
    case 'Online':
      return 'Online'
    case 'Offline':
      return 'Offline'
    default:
      return 'N/A'
  }
})

const machineStatus_time = ref('')
const machineStatus_refreshTime = () => {
  if (props.machineStatus.status == 'Loading' || props.machineStatus.status == 'N/A')
    machineStatus_time.value = ''
  else machineStatus_time.value = `Status: ${timeAgo(new Date(props.machineStatus.time))}`
}
</script>

<style lang="css" scoped>
/* .label {
  @reference text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1;
}
.input {
  @reference px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 mb-4;
} ==> use main.css*/
</style>
