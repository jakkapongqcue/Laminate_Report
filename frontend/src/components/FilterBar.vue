<template>
  <div
    class="p-4 mb-6 bg-white border border-gray-200 rounded-lg shadow-md no-print transition-[height] ease-in-out"
    :class="[prodPools.length > 0 ? 'lg:h-[457px]' : 'lg:h-[384px]']"
  >
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
            <div
              v-if="false"
              :title="machineStatus_time"
              @mouseover="machineStatus_refreshTime()"
              @click="focusMachineSelect()"
              class="absolute top-1/2 -translate-y-1/2 right-8"
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
        </div>

        <!-- Item FG -->
        <div class="class_InputGroup flex flex-col col-span-2 relative">
          <label class="class_Lable">
            <Icon_finishGood />
            Item FG
          </label>
          <div class="relative flex items-center gap-x-2">
            <div class="flex-1" ref="itemFgContainerRef">
              <input
                id="Input_FG"
                type="search"
                @dblclick.ctrl="handleDblClickExample()"
                @input="handleItemFgInput()"
                @keyup.enter="handleEnterOrSearch()"
                v-model.trim="filters.item_fg"
                placeholder="ระบุ Item FG หรือคำค้นหา เช่น 180101 (กด Enter เพื่อค้นหา)"
                class="w-full font-mono uppercase class_Input placeholder:text-xs"
                autocomplete="off"
              />

              <!-- Right action buttons / Pills inside Input -->
              <div class="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                <!-- Search Icon Button (Click to trigger search) -->
                <button
                  type="button"
                  @click="handleEnterOrSearch()"
                  :disabled="isCheckingItemFg"
                  title="กดเพื่อค้นหา Item FG (หรือกดปุ่ม Enter)"
                  class="hidden sm:inline-block p-2 rounded text-gray-400 hover:text-sky-600 bg-sky-50 focus:outline-none transition-colors"
                >
                  <Icon_search :cusClass="'w-4 h-4'" />
                </button>

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
                    class="flex items-center cursor-pointer"
                    @click="focusInputItemFG()"
                  >
                    <span
                      class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border select-none transition-all"
                      :class="itemFgPillClass"
                    >
                      <Icon_checkUncheck :statusIcon="itemFgStatus.status" />

                      <span>{{ itemFgStatus.text }}</span>
                    </span>
                  </div>
                </transition>
              </div>

              <!-- Search Dropdown Result (TOP 20) -->
              <div
                v-if="showDropdown && itemFgSearchResults && itemFgSearchResults.length > 0"
                class="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-300 rounded-lg shadow-xl overflow-hidden z-50 text-xs"
              >
                <div
                  class="px-3 py-1.5 bg-slate-50 border-b border-slate-200 flex justify-between items-center text-[11px] text-gray-500"
                >
                  <span>
                    พบ
                    <strong class="text-sky-600 font-semibold">
                      {{ itemFgSearchResults.length }}
                    </strong>
                    รายการที่ตรงกับคำค้นหา:
                  </span>
                  <button
                    type="button"
                    @click="closeDropdown()"
                    class="text-gray-400 hover:text-gray-600 px-1 font-bold"
                  >
                    ✕
                  </button>
                </div>
                <ul class="max-h-56 overflow-y-auto divide-y divide-slate-100">
                  <li
                    v-for="item in itemFgSearchResults"
                    :key="item.item_fg"
                    @click="handleSelectSearchResult(item)"
                    class="px-3 py-2 hover:bg-sky-50 cursor-pointer transition-colors flex flex-col group text-left"
                  >
                    <div class="flex items-center justify-between">
                      <span
                        class="font-mono font-bold text-gray-800 group-hover:text-sky-600"
                        v-html="highlightKeyword(item.item_fg, filters.item_fg)"
                      ></span>
                    </div>
                    <div
                      v-if="item.item_fg_name"
                      class="text-[11px] text-gray-500 truncate mt-0.5"
                      :title="item.item_fg_name"
                    >
                      {{ item.item_fg_name }}
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <!-- ProdPool Standard Radio Selection (When multiple pools found for Item FG) -->
          <div
            v-if="prodPools && prodPools.length > 1"
            class="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-xs"
          >
            <span class="font-semibold text-gray-700">รอบการเคลือบ:</span>
            <div class="flex flex-wrap items-center gap-x-4 gap-y-1.5">
              <label
                v-for="p in prodPools"
                :key="p.poolId"
                class="inline-flex items-center gap-1.5 cursor-pointer text-gray-700 hover:text-sky-700 font-medium"
              >
                <input
                  type="radio"
                  name="prodPoolSelect"
                  :value="p.poolId"
                  v-model="filters.prod_pool"
                  class="w-3.5 h-3.5 text-sky-600 border-gray-300 focus:ring-sky-500 cursor-pointer"
                />
                <span>{{ p.name }}</span>
                <span v-if="p.revId" class="text-[11px] self-end leading-3 text-gray-400 font-mono"
                  >(Rev.{{ p.revId }})</span
                >
              </label>
            </div>
          </div>

          <!-- Single Pool Info Indicator -->
          <div
            v-else-if="prodPools && prodPools.length === 1"
            class="flex items-center gap-1.5 mt-2 text-xs text-gray-500 h-[34px]"
          >
            <span>รอบการเคลือบ:</span>
            <span class="font-semibold text-gray-800">{{ prodPools[0].name }}</span>
            <span v-if="prodPools[0].revId" class="text-gray-400 font-mono"
              >(Rev.{{ prodPools[0].revId }})
            </span>
          </div>
          <div
            v-if="filters.item_fg_name && filters.item_fg_name.length > 0"
            class="flex items-center gap-1.5 mt-2 text-xs text-gray-500"
          >
            <span class="text-nowrap self-start">ชื่อสินค้า:</span>
            <span class="line-clamp-2 md:line-clamp-1" :title="filters.item_fg_name"
              >{{ filters.item_fg_name }}
            </span>
          </div>
        </div>

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
import { defineProps, defineEmits, computed, ref, watch, onMounted, onUnmounted } from 'vue'
import Icon_calendar from './icons/Icon_calendar.vue'
import Icon_time from './icons/Icon_time.vue'
import Icon_print from './icons/Icon_print.vue'
import Icon_search from './icons/Icon_search.vue'
import Icon_machine from './icons/Icon_machine.vue'
import Icon_finishGood from './icons/Icon_finishGood.vue'
import Icon_checkUncheck from './icons/Icon_checkUncheck.vue'

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

const itemFgContainerRef = ref(null)
const showDropdown = ref(false)

watch(
  () => props.itemFgSearchResults,
  (newVal) => {
    if (newVal && newVal.length > 0) {
      showDropdown.value = true
    } else {
      showDropdown.value = false
    }
  },
  { deep: true },
)

const handleClickOutside = (event) => {
  if (itemFgContainerRef.value && !itemFgContainerRef.value.contains(event.target)) {
    closeDropdown()
  }
}

const handleFocusItemFg = (event) => {
  // open dropdown when container has focus
  // Guard: only react when focus is inside the Item FG container
  if (itemFgContainerRef.value && itemFgContainerRef.value.contains(event.target)) {
    // Re-show dropdown if there are existing search results
    if (props.itemFgSearchResults && props.itemFgSearchResults.length > 0) {
      showDropdown.value = true
    }
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('focusin', handleFocusItemFg)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('focusin', handleFocusItemFg)
})

const closeDropdown = () => {
  showDropdown.value = false
}

const handleSelectSearchResult = (item) => {
  showDropdown.value = false
  emit('selectItemFgFromSearch', item)
}

const highlightKeyword = (text, query) => {
  if (!text) return ''
  const q = (query || '').trim()
  if (!q) return text
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(${escaped})`, 'gi')
  return text.replace(
    regex,
    '<span class="bg-yellow-200 text-yellow-900 font-bold px-0.5 rounded">$1</span>', //  what is $1, Ans: $1 = group name of the matched pattern
  )
}

const handleDblClickExample = () => {
  props.filters.item_fg = 'FGF0001020180101'
  emit('checkItemFGwithMachine')
}

const handleItemFgInput = () => {
  if (showDropdown.value) {
    showDropdown.value = false
    emit('clearItemFgSearchResults')
  }
  emit('clearItemFgStatus')
}

const handleEnterOrSearch = () => {
  closeDropdown()
  emit('searchItemFGwithMachine')
}

const focusInputItemFG = () => {
  document.getElementById('Input_FG').focus()
}
</script>

<style lang="css" scoped>
input[type='search']::-webkit-search-decoration,
input[type='search']::-webkit-search-cancel-button,
input[type='search']::-webkit-search-results-button,
input[type='search']::-webkit-search-results-decoration {
  display: none;
}
</style>
