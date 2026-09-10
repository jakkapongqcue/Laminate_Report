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
            @change="handleMachineChange()"
          >
            <option v-for="m in machines" :key="m.id" :value="m.id">
              {{ m.name }}
            </option>
          </select>
          <div
            :title="machineStatus_time"
            @mouseover="machineStatus_refreshTime()"
            @click="focusMachineSelect()"
            class="absolute top-1/2 translate-y-[-45%] right-8"
          >
            <span
              class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border select-none transition-all cursor-pointer"
              :class="machineStatus_pillClass"
            >
              <span class="w-2 h-2 rounded-full animate-pulse" :class="machineStatus_lightClass">
              </span>
              {{ machineStatus_text }}
            </span>
          </div>
        </div>

        <!-- Item FG -->
        <div class="flex flex-col col-span-2 relative">
          <label class="class_Lable">
            <Icon_finishGood />
            Item FG <span class="text-rose-500 font-bold">*</span>
          </label>
          <div class="flex items-center gap-x-2 mb-4">
            <div class="relative flex-1">
              <input
                id="Input_FG"
                type="text"
                @focus="autoInputFGPrefix()"
                @dblclick.ctrl="handleDblClickExample()"
                @input="handleItemFgInput()"
                @change="checkItemFGwithMachine()"
                @keyup.enter="checkItemFGwithMachine()"
                v-model.trim="filters.item_fg"
                placeholder="ระบุ Item FG (เช่น FGF0165010103602)"
                class="w-full pr-32 font-mono uppercase class_Input !mb-0"
                required
              />

              <!-- Pill Notification Inside Input (Persistent until text changes) -->
              <transition
                enter-active-class="transition duration-200 ease-out"
                enter-from-class="opacity-0 scale-90"
                enter-to-class="opacity-100 scale-100"
                leave-active-class="transition duration-200 ease-in"
                leave-from-class="opacity-100 scale-100"
                leave-to-class="opacity-0 scale-90"
              >
                <div
                  v-if="itemFgStatus && itemFgStatus.show"
                  :title="itemFgStatus.message || ''"
                  class="absolute right-2 top-1/2 -translate-y-1/2 flex items-center cursor-pointer"
                  @click="focusInputItemFG()"
                >
                  <span
                    class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border select-none transition-all shadow-sm"
                    :class="itemFgPillClass"
                  >
                    <!-- Checking Pulse Dot -->
                    <span
                      v-if="itemFgStatus.status === 'checking'"
                      class="w-2 h-2 rounded-full bg-sky-500 animate-pulse"
                    ></span>

                    <!-- Found Green Icon -->
                    <svg
                      v-else-if="itemFgStatus.status === 'found'"
                      class="w-3.5 h-3.5 text-emerald-600 shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2.5"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>

                    <!-- Not Found Red Icon -->
                    <svg
                      v-else-if="itemFgStatus.status === 'not_found'"
                      class="w-3.5 h-3.5 text-rose-600 shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2.5"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>

                    <span>{{ itemFgStatus.text }}</span>
                  </span>
                </div>
              </transition>
            </div>

            <!-- <button
              type="button"
              @click="$emit('checkItemFGwithMachine')"
              :disabled="!filters.item_fg || isCheckingItemFg"
              class="h-[38px] w-28 shrink-0 justify-center px-2.5 py-1 text-xs font-medium text-white bg-sky-600 rounded hover:bg-sky-700 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1 shadow-sm"
              title="ตรวจสอบข้อมูล Item FG ในระบบ AX"
            >
              <Icon_checking :isChecking="isCheckingItemFg" />
              <span>{{ isCheckingItemFg ? 'กำลังตรวจ...' : 'ตรวจสอบ' }}</span>
            </button> -->
          </div>
        </div>

        <!-- Date Range -->
        <div class="flex flex-col self-end col-span-1 col-start-1">
          <label class="class_Lable">
            <Icon_calendar />
            วันที่เริ่มต้น
          </label>
          <input type="date" v-model="filters.date_from" class="class_Input" />
        </div>

        <!-- Time Range -->
        <div class="flex flex-col self-end col-span-1">
          <label class="class_Lable">
            <Icon_time />
            เวลาม้วนแรกที่ทำการผลิต
          </label>
          <input type="time" v-model="filters.time_from" class="class_Input" />
        </div>

        <!-- Hourly Step (Visible on Report mode) -->
        <div class="flex flex-col col-span-2 lg:col-span-1">
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

        <div class="flex flex-col col-span-1 col-start-1">
          <label class="class_Lable">
            <Icon_calendar />
            วันที่สิ้นสุด
          </label>
          <input type="date" v-model="filters.date_to" class="class_Input" />
        </div>

        <div class="flex flex-col col-span-1">
          <label class="class_Lable">
            <Icon_time />
            เวลาสิ้นสุด
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
          :disabled="statusLoading || !filters.item_fg"
          :title="!filters.item_fg ? 'กรุณาระบุ Item FG ก่อนดึงข้อมูล' : ''"
          class="inline-flex justify-center items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium rounded-md shadow transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed w-40"
        >
          <Icon_search :loading="statusLoading" :cusClass="'w-4 h-4'" />
          ดึงข้อมูล{{ currentViewMode === 'chart' ? 'กราฟ' : 'รายงาน' }}
        </button>

        <!-- Print / Export button (for Report mode) -->
        <button
          v-if="currentViewMode === 'report'"
          :disabled="!isHaveReportData"
          @click="$emit('print')"
          class="inline-flex justify-center items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-md shadow transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed w-40"
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
import Icon_finishGood from './icons/Icon_finishGood.vue'
import Icon_checking from './icons/Icon_checking.vue'

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
})

const emit = defineEmits([
  'search',
  'print',
  'refreshMachine',
  'fetchMachineStatus',
  'checkItemFGwithMachine',
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

const fetchMachineStatus = async () => {
  emit('fetchMachineStatus')
}

const handleMachineChange = () => {
  fetchMachineStatus()
  if (props.filters.item_fg && props.filters.item_fg.length > 3) {
    emit('checkItemFGwithMachine')
  }
}

const focusMachineSelect = () => {
  const Input_Machine = document.getElementById('Input_Machine')
  if (Input_Machine) {
    if (typeof Input_Machine.showPicker === 'function') {
      Input_Machine.showPicker()
    }
    Input_Machine.focus()
  }
}

const itemFgPillClass = computed(() => {
  if (!props.itemFgStatus) return ''
  switch (props.itemFgStatus.status) {
    case 'found':
      return 'bg-emerald-50 text-emerald-700 border-emerald-300'
    case 'not_found':
      return 'bg-rose-50 text-rose-700 border-rose-300'
    case 'checking':
      return 'bg-sky-50 text-sky-700 border-sky-300'
    default:
      return 'bg-gray-100 text-gray-700 border-gray-300'
  }
})

const machineStatus_pillClass = computed(() => {
  switch (props.machineStatus.status) {
    case 'Error':
      return 'bg-red-400 text-white border-red-400 duration-300'
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
      return 'bg-red-600'
    case 'Loading':
      return ''
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

const autoInputFGPrefix = () => {
  // auto add text "FG" at the beginning of the input if not already present
  if (!props.filters.item_fg) {
    props.filters.item_fg = 'FGF'
  }
}

const handleDblClickExample = () => {
  props.filters.item_fg = 'FGF0165010103602'
  emit('checkItemFGwithMachine')
}

const handleItemFgInput = () => {
  emit('clearItemFgStatus')
}

const checkItemFGwithMachine = () => {
  // if (!props.filters.item_fg || props.filters.item_fg.length <= 3) {
  //   emit('clearItemFgStatus')
  //   return
  // }
  emit('checkItemFGwithMachine')
}

const focusInputItemFG = () => {
  document.getElementById('Input_FG').focus()
}
</script>
