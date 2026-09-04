<template>
  <div class="mx-auto" style="max-width: 297mm">
    <!-- App Header Title (Hidden on Print) -->
    <AppHeadTitle />

    <!-- Filter Controls Bar -->
    <FilterBar
      :filters="filters"
      :machines="machines"
      :statusLoading="isLoading"
      :machineStatus="machineStatus"
      :currentViewMode="viewMode"
      :isHaveReportData="reportData && reportData.pages && reportData.pages.length > 0"
      @search="handleSearch"
      @print="printReport"
      @refreshMachine="fetchMachines"
      @fetchMachineStatus="fetchMachineStatus"
    />

    <!-- View Mode Switcher Tab Bar (Hidden on Print) -->

    <SwitchViewMode :currentViewMode="viewMode" @setViewMode="setViewMode" />

    <!-- Loading State Overlay -->
    <div
      v-if="isLoading"
      class="flex flex-col items-center justify-center py-20 bg-white border border-gray-200 rounded-lg shadow no-print"
    >
      <Icon_circleLoad :cus-class="'h-10 w-10 text-sky-600 mb-3'" />
      <p class="text-sm font-semibold text-gray-700">
        กำลังดึงข้อมูล{{ viewMode === 'report' ? 'รายงาน' : 'กราฟ' }}จากระบบ...
      </p>
      <p class="mt-1 text-xs text-gray-500">กรุณารอสักครู่</p>
    </div>

    <!-- Error Alert State -->
    <div
      v-else-if="errorMessage"
      class="flex items-center justify-between p-4 mb-6 text-sm text-red-700 border border-red-200 rounded-lg no-print bg-red-50"
    >
      <div class="flex items-center gap-2">
        <Icon_error />
        <span>{{ errorMessage }}</span>
      </div>
      <button
        @click="handleSearch"
        class="px-3 py-1 text-xs text-white bg-red-600 rounded hover:bg-red-700"
      >
        ลองใหม่
      </button>
    </div>

    <!-- ── Mode 1: Report Pages Rendering Container ────────────────── -->

    <Slot_MainContainer
      v-else-if="
        viewMode === 'report' && reportData && reportData.pages && reportData.pages.length > 0
      "
    >
      <div v-for="page in reportData.pages" :key="page.page_number" class="report-wrapper">
        <LaminateReportSheet
          v-bind:page-data="page"
          :machine="reportData.machine"
          :date-from="reportData.date_from"
          :date-to="reportData.date_to"
          :time-from="reportData.time_from"
          :time-to="reportData.time_to"
        />
      </div>
    </Slot_MainContainer>

    <!-- ── Mode 2: Chart Rendering Container ────────────────────────── -->
    <div
      v-else-if="
        viewMode === 'chart' && chartData && chartData.parameters && chartData.parameters.length > 0
      "
      class="no-print"
    >
      <LaminateChart
        :chart-data="chartData"
        :machine="chartData.machine"
        :date-from="chartData.date_from"
        :date-to="chartData.date_to"
        :time-from="chartData.time_from"
        :time-to="chartData.time_to"
      />
    </div>

    <!-- No Data State -->
    <div
      v-else
      class="py-16 text-center bg-white border border-gray-200 rounded-lg shadow-sm no-print"
    >
      <Icon_report v-if="viewMode === 'report'" :class="'h-12 w-12 mb-2'" />
      <Icon_chart v-else cusClass="h-12 w-12 mb-2" />
      <h3 class="text-sm font-semibold text-gray-800">
        <div v-if="loadFristTime">
          กดปุ่ม "ดึงข้อมูล" เพื่อเริ่มสร้าง{{ viewMode === 'report' ? 'รายงาน' : 'กราฟ' }}
        </div>
        <div v-else>
          ไม่พบข้อมูล{{ viewMode === 'report' ? 'รายงาน' : 'กราฟ' }}ในช่วงเวลาดังกล่าว
        </div>
      </h3>
      <p v-if="!loadFristTime" class="mt-1 text-xs text-gray-500">
        กดปุ่ม "ดึงข้อมูล" เพื่อเริ่มค้นหาใหม่
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import FilterBar from '../components/FilterBar.vue'
import LaminateReportSheet from '../components/LaminateReportSheet.vue'
import LaminateChart from '../components/LaminateChart.vue'
import AppHeadTitle from '../components/AppHeadTitle.vue'
import Icon_circleLoad from '../components/icons/Icon_circleLoad.vue'
import Icon_report from '../components/icons/Icon_report.vue'
import Icon_chart from '../components/icons/Icon_chart.vue'
import Icon_error from '../components/icons/Icon_error.vue'
import SwitchViewMode from '../components/SwitchViewMode.vue'
import Slot_MainContainer from '../components/Slot_MainContainer.vue'

const getTodayStr = () => {
  const d = new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const viewMode = ref('report') // 'report' | 'chart'

const filters = reactive({
  machine: '1LB09_Bobst',
  date_from: getTodayStr(),
  date_to: getTodayStr(),
  time_from: '08:00',
  time_to: '17:00',
  hour_step: 1,
  use_test_api: false,
  // setup filter: default date same as date_from, time empty (user must select)
  setup_date: getTodayStr(),
  setup_time: '',
})

const loadUseTestApiSetting = () => {
  const savedValue = localStorage.getItem('laminate-report-use-test-api')
  if (savedValue !== null) {
    filters.use_test_api = savedValue === 'true'
  }
}

const machines = ref([])
const loadFristTime = ref(true)
const isLoading = ref(false)
const errorMessage = ref('')
const reportData = ref(null)
const chartData = ref(null)

const BACKEND_API_BASE_URL = import.meta.env.VITE_BACK_BASE_URL

const machineStatus = ref({
  status: 'N/A', //'N/A', 'Online', 'Offline'
  time: '',
})

const fetchMachines = async () => {
  try {
    const res = await fetch(BACKEND_API_BASE_URL + '/api/machines')
    if (res.ok) {
      const data = await res.json()
      if (data && data.length > 0) {
        machines.value = data
      }
    }
  } catch (err) {
    console.warn('Could not fetch machines list, using defaults:', err)
  }
}

const fetchReport = async () => {
  if (!filters.setup_time) {
    errorMessage.value = 'กรุณาเลือกเวลา Set up ก่อนกดค้นหา'
    return
  }

  isLoading.value = true
  errorMessage.value = ''
  loadFristTime.value = false

  try {
    const queryParams = new URLSearchParams({
      machine: filters.machine,
      date_from: filters.date_from,
      date_to: filters.date_to,
      time_from: filters.time_from,
      time_to: filters.time_to,
      hour_step: filters.hour_step.toString(),
    })

    if (filters.setup_time) {
      queryParams.append('setup_time', filters.setup_time)
      queryParams.append('setup_date', filters.setup_date || filters.date_from)
    }

    const path = filters.use_test_api ? '/api/report/laminate/test' : '/api/report/laminate'
    const res = await fetch(`${BACKEND_API_BASE_URL}${path}?${queryParams.toString()}`)

    if (!res.ok) {
      throw new Error(`Server returned status ${res.status}`)
    }

    const data = await res.json()
    reportData.value = data
  } catch (err) {
    console.error('Fetch report error:', err)
    errorMessage.value = `เกิดข้อผิดพลาดในการดึงข้อมูลรายงาน: ${err.message}`
  } finally {
    isLoading.value = false
  }
}

const fetchChart = async () => {
  isLoading.value = true
  errorMessage.value = ''
  loadFristTime.value = false

  try {
    const queryParams = new URLSearchParams({
      machine: filters.machine,
      date_from: filters.date_from,
      date_to: filters.date_to,
      time_from: filters.time_from,
      time_to: filters.time_to,
    })

    const path = filters.use_test_api ? '/api/chart/laminate/test' : '/api/chart/laminate'
    const res = await fetch(`${BACKEND_API_BASE_URL}${path}?${queryParams.toString()}`)

    if (!res.ok) {
      throw new Error(`Server returned status ${res.status}`)
    }

    const data = await res.json()
    chartData.value = data
  } catch (err) {
    console.error('Fetch chart error:', err)
    errorMessage.value = `เกิดข้อผิดพลาดในการดึงข้อมูลกราฟ: ${err.message}`
  } finally {
    isLoading.value = false
  }
}

const handleSearch = () => {
  if (viewMode.value === 'report') {
    fetchReport()
  } else {
    fetchChart()
  }
}

const setViewMode = (mode) => {
  viewMode.value = mode
  // If switching to chart mode and chart data is not yet fetched, fetch it automatically if user had already searched once
  clearErrorMessage()
  if (mode === 'chart' && !chartData.value && !loadFristTime.value) {
    fetchChart()
  } else if (mode === 'report' && !reportData.value && !loadFristTime.value) {
    fetchReport()
  }
}

const clearErrorMessage = () => {
  errorMessage.value = ''
}

const printReport = () => {
  window.print()
}

let machineStatusAbortController = null

const fetchMachineStatus = async () => {
  if (machineStatusAbortController) {
    machineStatusAbortController.abort()
  }
  machineStatusAbortController = new AbortController()

  machineStatus.value.status = 'Loading'
  try {
    const queryParams = new URLSearchParams({
      machine: filters.machine,
    })
    const res = await fetch(BACKEND_API_BASE_URL + '/api/machineStatus?' + queryParams.toString(), {
      signal: machineStatusAbortController.signal,
    })
    if (!res.ok) {
      throw new Error(`Server returned status ${res.status}`)
    }
    const data = await res.json()
    machineStatus.value.status = data.status.toString() == '1' ? 'Online' : 'Offline'
    machineStatus.value.time = data.updateTime.toString()
  } catch (err) {
    if (err.name === 'AbortError') {
      return
    }
    console.warn('Could not fetch machine status:', err)
    machineStatus.value.status = 'Error'
    machineStatus.value.time = ''
  }
}

onMounted(() => {
  loadUseTestApiSetting()
  fetchMachines()
  fetchMachineStatus()

  setInterval(() => {
    fetchMachineStatus()
  }, 300000) // 5 minutes (5 * 60 * 1000)
})

// keep setup_date default in sync with date_from unless user sets a different setup_date
let _lastDateFrom = filters.date_from
watch(
  () => filters.date_from,
  (newVal) => {
    if (filters.setup_date === _lastDateFrom || !filters.setup_date) {
      filters.setup_date = newVal
    }
    _lastDateFrom = newVal
  },
)
</script>
