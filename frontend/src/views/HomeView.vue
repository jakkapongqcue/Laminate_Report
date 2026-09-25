<template>
  <main class="mx-auto" style="max-width: 297mm">
    <!-- App Header Title (Hidden on Print) -->
    <AppHeadTitle :machines="machines" />

    <!-- Filter Controls Bar -->
    <FilterBar
      :filters="filters"
      :machines="machines"
      :solventTypes="solventTypes"
      :statusLoading="isLoading"
      :isCheckingItemFg="isCheckingItemFg || isSearchingItemFg"
      :itemFgStatus="itemFgStatus"
      :machineStatus="machineStatus"
      :currentViewMode="viewMode"
      :isHaveReportData="reportData && reportData.pages && reportData.pages.length > 0"
      :prodPools="prodPools"
      :itemFgSearchResults="itemFgSearchResults"
      @search="handleSearch"
      @print="printReport"
      @refreshMachine="fetchMachines"
      @fetchMachineStatus="fetchMachineStatus"
      @checkItemFGwithMachine="checkItemFGwithMachine"
      @searchItemFGwithMachine="searchItemFGwithMachine"
      @selectItemFgFromSearch="selectItemFgFromSearch"
      @clearItemFgSearchResults="clearItemFgSearchResults"
      @clearItemFgStatus="clearItemFgStatus"
    />

    <!-- View Mode Switcher Tab Bar (Hidden on Print) -->

    <SwitchViewMode :currentViewMode="viewMode" @setViewMode="setViewMode" />

    <!-- Loading State Overlay -->
    <div v-if="isLoading" role="status" aria-live="polite" class="no-print flex flex-col items-center justify-center rounded-lg border border-gray-200 bg-white py-20 shadow">
      <Icon_circleLoad :cus-class="'h-10 w-10 text-sky-600 mb-3'" />
      <p class="text-sm font-semibold text-gray-700">กำลังดึงข้อมูล{{ viewMode === "report" ? "รายงาน" : "กราฟ" }}จากระบบ...</p>
      <p class="mt-1 text-xs text-gray-500">กรุณารอสักครู่</p>
    </div>

    <!-- Error Alert State -->
    <div v-else-if="errorMessage" role="alert" class="no-print mb-6 flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
      <div class="flex items-center gap-2">
        <Icon_error />
        <span>{{ errorMessage }}</span>
      </div>
      <button type="button" @click="handleSearch" class="rounded bg-red-600 px-3 py-1 text-xs text-white hover:bg-red-700">ลองใหม่</button>
    </div>

    <!-- ── Mode 1: Report Pages Rendering Container ────────────────── -->

    <Slot_MainContainer
      v-else-if="viewMode === 'report' && reportData && reportData.pages && reportData.pages.length > 0"
      id="report-panel"
      role="tabpanel"
      aria-label="รายงานตรวจสอบเครื่องจักร"
    >
      <div v-for="page in reportData.pages" :key="page.page_number" class="report-wrapper">
        <Printing_ReportSheet
          v-if="activeProcessType === 'Printing'"
          v-bind:page-data="page"
          :machine="reportData.machine"
          :item-fg="reportData.item_fg"
          :item-fg-name="reportData.item_fg_name"
          :date-from="reportData.date_from"
          :date-to="reportData.date_to"
          :time-from="reportData.time_from"
          :time-to="reportData.time_to"
        />
        <BlownFilm_ReportSheet
          v-else-if="activeProcessType === 'BlownFilm'"
          v-bind:page-data="page"
          :machine="reportData.machine"
          :item-fg="reportData.item_fg"
          :item-fg-name="reportData.item_fg_name"
          :date-from="reportData.date_from"
          :date-to="reportData.date_to"
          :time-from="reportData.time_from"
          :time-to="reportData.time_to"
        />
        <Laminate_ReportSheet
          v-else
          v-bind:page-data="page"
          :machine="reportData.machine"
          :item-fg="reportData.item_fg"
          :item-fg-name="reportData.item_fg_name"
          :solvent-type-name="reportData.item_fg ? reportData.solvent_type_name : ''"
          :date-from="reportData.date_from"
          :date-to="reportData.date_to"
          :time-from="reportData.time_from"
          :time-to="reportData.time_to"
        />
      </div>
    </Slot_MainContainer>

    <!-- ── Mode 2: Chart Rendering Container ────────────────────────── -->
    <div
      v-else-if="viewMode === 'chart' && chartData && chartData.parameters && chartData.parameters.length > 0"
      id="chart-panel"
      role="tabpanel"
      aria-label="กราฟวิเคราะห์แนวโน้ม"
      class="no-print"
    >
      <Global_Chart
        :chart-data="chartData"
        :machine="chartData.machine"
        :date-from="chartData.date_from"
        :date-to="chartData.date_to"
        :time-from="chartData.time_from"
        :time-to="chartData.time_to"
        :process-type="activeProcessType"
      />
    </div>

    <!-- No Data State -->
    <div v-else class="no-print rounded-lg border border-gray-200 bg-white py-16 text-center shadow-sm">
      <Icon_report v-if="viewMode === 'report'" :class="'mb-2 h-12 w-12'" />
      <Icon_chart v-else cusClass="h-12 w-12 mb-2" />
      <div class="text-sm font-semibold text-gray-800">
        <div v-if="loadFirstTime">กดปุ่ม "ดึงข้อมูล" เพื่อเริ่มสร้าง{{ viewMode === "report" ? "รายงาน" : "กราฟ" }}</div>
        <div v-else>ไม่พบข้อมูล{{ viewMode === "report" ? "รายงาน" : "กราฟ" }}ในช่วงเวลาดังกล่าว</div>
      </div>
    </div>
  </main>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from "vue"
import { useRoute } from "vue-router"
import FilterBar from "../components/FilterBar.vue"
import Laminate_ReportSheet from "../components/Report/Laminate_ReportSheet.vue"
import Printing_ReportSheet from "../components/Report/Printing_ReportSheet.vue"
import BlownFilm_ReportSheet from "../components/Report/BlownFilm_ReportSheet.vue"
import Global_Chart from "../components/Report/Global_Chart.vue"
import AppHeadTitle from "../components/AppHeadTitle.vue"
import Icon_circleLoad from "../components/icons/Icon_circleLoad.vue"
import Icon_report from "../components/icons/Icon_report.vue"
import Icon_chart from "../components/icons/Icon_chart.vue"
import Icon_error from "../components/icons/Icon_error.vue"
import SwitchViewMode from "../components/SwitchViewMode.vue"
import Slot_MainContainer from "../components/Slot_MainContainer.vue"

const route = useRoute()
const props = defineProps({
  processType: {
    type: String,
    default: "Laminate",
  },
})

const activeProcessType = computed(() => {
  if (props.processType) return props.processType
  if (route.path === "/printing") return "Printing"
  if (route.path === "/blownfilm") return "BlownFilm"
  return "Laminate"
})

const getTodayStr = () => {
  const d = new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

const viewMode = ref("report") // 'report' | 'chart'

const filters = reactive({
  machineId: "1LB09",
  item_fg: "",
  item_fg_name: "",
  prod_pool: "",
  detail_index: 1,
  date_from: getTodayStr(),
  date_to: getTodayStr(),
  time_from: "08:00",
  time_to: "17:00",
  hour_step: 1,
})

const prodPools = ref([])
const solventTypes = ref([])
const machines = ref([])
const loadFirstTime = ref(true)
const isLoading = ref(false)
const errorMessage = ref("")
const reportData = ref(null)
const chartData = ref(null)

const BACKEND_API_BASE_URL = import.meta.env.VITE_BACK_BASE_URL || ""

const machineStatus = ref({
  status: "N/A", //'N/A', 'Online', 'Offline'
  time: "",
})

const isCheckingItemFg = ref(false)

const itemFgStatus = reactive({
  show: false,
  status: "idle", // 'idle' | 'checking' | 'found' | 'not_found'
  text: "",
  message: "",
  timer: null,
})

const initSolventTypesForMachine = (machId) => {
  const m = machines.value.find((mach) => mach.id === machId)
  if (m && m.supportedSolventTypes && m.supportedSolventTypes.length > 0) {
    if (m.solventTypeRules) {
      solventTypes.value = m.supportedSolventTypes.map((idx) => ({
        detailIndex: idx,
        name: m.solventTypeRules[idx]?.name || `Solvent Process ${idx}`,
      }))
    } else {
      solventTypes.value = m.supportedSolventTypes.map((idx) => ({
        detailIndex: idx,
        name: `Solvent Process ${idx}`,
      }))
    }
    filters.detail_index = m.supportedSolventTypes[0]
  } else {
    solventTypes.value = []
    filters.detail_index = 1
  }
}

const clearItemFgStatus = () => {
  if (itemFgStatus.timer) {
    clearTimeout(itemFgStatus.timer)
    itemFgStatus.timer = null
  }
  itemFgStatus.show = false
  itemFgStatus.status = "idle"
  prodPools.value = []
  filters.prod_pool = ""
  filters.item_fg_name = ""
  initSolventTypesForMachine(filters.machineId)
}

const showItemFgStatus = ({ status = "", text = "", message = "", duration = 0 }) => {
  if (itemFgStatus.timer) {
    clearTimeout(itemFgStatus.timer)
    itemFgStatus.timer = null
  }
  itemFgStatus.status = status
  itemFgStatus.text = text
  itemFgStatus.message = message
  itemFgStatus.show = true

  if (duration > 0) {
    itemFgStatus.timer = setTimeout(() => {
      itemFgStatus.show = false
    }, duration)
  }
}

const checkItemFGwithMachine = async () => {
  const cleanItemFg = (filters.item_fg || "").trim()
  if (!cleanItemFg) {
    showItemFgStatus({
      status: "not_found",
      text: "ระบุ Item FG",
      message: "โปรดกรอกรหัส Item FG ก่อนทำการตรวจสอบ",
      duration: 3500,
    })
    return
  }

  isCheckingItemFg.value = true
  showItemFgStatus({
    status: "checking",
    text: "กำลังตรวจ...",
    message: "กำลังตรวจสอบข้อมูลกับระบบ AX...",
    duration: 0,
  })

  try {
    const queryParams = new URLSearchParams({
      machine: filters.machineId,
      item_fg: cleanItemFg,
      processType: activeProcessType.value,
    })

    const res = await fetch(`${BACKEND_API_BASE_URL}/api/checkItemFG?${queryParams.toString()}`)
    const data = await res.json()

    // Ensure user hasn't changed input while request was in-flight
    if ((filters.item_fg || "").trim() !== cleanItemFg) {
      return
    }

    if (data.exists) {
      filters.item_fg_name = data.item_fg_name || ""
      prodPools.value = data.prodPools || []
      if (data.defaultPool) {
        filters.prod_pool = data.defaultPool
      } else if (data.prodPools && data.prodPools.length > 0) {
        filters.prod_pool = data.prodPools[0].poolId
      }
      if (data.solventTypes && data.solventTypes.length > 0) {
        solventTypes.value = data.solventTypes
        filters.detail_index = data.defaultSolventType || data.solventTypes[0].detailIndex
      } else {
        initSolventTypesForMachine(filters.machineId)
      }
      showItemFgStatus({
        status: "found",
        text: "มีข้อมูล PS ในระบบ",
        message: data.message,
      })
    } else {
      filters.item_fg_name = ""
      prodPools.value = []
      filters.prod_pool = ""
      initSolventTypesForMachine(filters.machineId)
      showItemFgStatus({
        status: "not_found",
        text: "ไม่พบข้อมูล PS ในระบบ",
        message: data.message,
      })
    }
  } catch (err) {
    console.error("Check Item FG error:", err)
    if ((filters.item_fg || "").trim() === cleanItemFg) {
      showItemFgStatus({
        status: "not_found",
        text: "เกิดข้อผิดพลาด",
        message: `ไม่สามารถตรวจสอบข้อมูลกับเซิร์ฟเวอร์ได้: ${err.message}`,
      })
      prodPools.value = []
    }
  } finally {
    isCheckingItemFg.value = false
  }
}

const itemFgSearchResults = ref([])
const isSearchingItemFg = ref(false)

const searchItemFGwithMachine = async () => {
  const keyword = (filters.item_fg || "").trim()
  if (!keyword) {
    showItemFgStatus({
      status: "not_found",
      text: "ระบุคำค้นหา",
      message: "โปรดกรอกคำค้นหา Item FG ก่อน",
      duration: 3000,
    })
    return
  }

  if (keyword.length < 4) {
    showItemFgStatus({
      status: "not_found",
      text: "ระบุอย่างน้อย 4 ตัว",
      message: "กรุณากรอกคำค้นหาอย่างน้อย 4 ตัวอักษร",
      duration: 3500,
    })
    return
  }

  isSearchingItemFg.value = true
  showItemFgStatus({
    status: "checking",
    text: "กำลังค้นหา...",
    message: `กำลังค้นหา Item FG ที่มี "${keyword}" ในระบบ AX...`,
    duration: 0,
  })

  try {
    const queryParams = new URLSearchParams({
      machine: filters.machineId,
      keyword: keyword,
      processType: activeProcessType.value,
    })

    const res = await fetch(`${BACKEND_API_BASE_URL}/api/searchItemFG?${queryParams.toString()}`)
    const data = await res.json()

    if (data.success && data.items && data.items.length > 0) {
      if (data.items.length === 1) {
        // Only 1 item found -> Auto-select and check PS directly
        filters.item_fg = data.items[0].item_fg
        itemFgSearchResults.value = []
        await checkItemFGwithMachine()
      } else {
        // Multiple items found -> Show dropdown options
        itemFgSearchResults.value = data.items
        showItemFgStatus({
          status: "found",
          text: `พบ ${data.items.length} รายการ`,
          message: `พบ ${data.items.length} รายการที่ตรงกับคำค้นหา โปรดเลือกจากรายการ`,
        })
      }
    } else {
      itemFgSearchResults.value = []
      showItemFgStatus({
        status: "not_found",
        text: "ไม่พบรายการ",
        message: data.message || `ไม่พบ Item FG ที่มีคำว่า "${keyword}"`,
        duration: 4000,
      })
    }
  } catch (err) {
    console.error("Search Item FG error:", err)
    itemFgSearchResults.value = []
    showItemFgStatus({
      status: "not_found",
      text: "เกิดข้อผิดพลาด",
      message: `ไม่สามารถค้นหาข้อมูลได้: ${err.message}`,
    })
  } finally {
    isSearchingItemFg.value = false
  }
}

const selectItemFgFromSearch = async (item) => {
  filters.item_fg = item.item_fg
  filters.item_fg_name = item.item_fg_name
  itemFgSearchResults.value = []
  await checkItemFGwithMachine()
}

const clearItemFgSearchResults = () => {
  itemFgSearchResults.value = []
}

const fetchMachines = async (procType = activeProcessType.value) => {
  try {
    const query = procType ? `?processType=${encodeURIComponent(procType)}` : ""
    const res = await fetch(`${BACKEND_API_BASE_URL}/api/machines${query}`)
    if (res.ok) {
      const data = await res.json()
      if (data && data.length > 0) {
        machines.value = data
        // Select first available machine with MES if current selection is not valid or has no MES
        const currentMatch = data.find((m) => m.id === filters.machineId)
        if (!currentMatch || currentMatch.isMES === false) {
          const firstMes = data.find((m) => m.isMES !== false)
          filters.machineId = firstMes ? firstMes.id : data[0].id
        }
        initSolventTypesForMachine(filters.machineId)
      }
    }
  } catch (err) {
    console.warn("Could not fetch machines list, using defaults:", err)
  }
}

watch(
  () => filters.machineId,
  (newId) => {
    initSolventTypesForMachine(newId)
  },
)

watch(
  () => activeProcessType.value,
  async (newType) => {
    reportData.value = null
    chartData.value = null
    loadFirstTime.value = true
    errorMessage.value = ""
    clearItemFgStatus()
    await fetchMachines(newType)
    // fetchMachineStatus()
  },
)

const currentMachineObj = computed(() => {
  return machines.value.find((m) => m.id === filters.machineId) || null
})

const validateDateRange = (dateFrom, dateTo, maxDays = 31) => {
  if (!dateFrom || !dateTo) {
    return "กรุณาระบุวันที่เริ่มต้นและวันที่สิ้นสุด"
  }
  const from = new Date(dateFrom)
  const to = new Date(dateTo)
  if (isNaN(from.getTime()) || isNaN(to.getTime())) {
    return "รูปแบบวันที่ไม่ถูกต้อง"
  }
  const diffDays = Math.round((to - from) / (1000 * 60 * 60 * 24))
  if (diffDays < 0) {
    return "วันที่เริ่มต้นต้องไม่มากกว่าวันที่สิ้นสุด"
  }
  if (diffDays > maxDays) {
    return `ช่วงเวลาที่เลือกต้องไม่เกิน ${maxDays} วัน (คุณเลือก ${diffDays} วัน) กรุณาเลือกช่วงเวลาใหม่`
  }
  return null
}

const fetchReport = async () => {
  const dateErr = validateDateRange(filters.date_from, filters.date_to, 31)
  if (dateErr) {
    errorMessage.value = dateErr
    return
  }

  isLoading.value = true
  errorMessage.value = ""
  loadFirstTime.value = false

  try {
    const queryParams = new URLSearchParams({
      machine: filters.machineId,
      date_from: filters.date_from,
      date_to: filters.date_to,
      time_from: filters.time_from,
      time_to: filters.time_to,
      hour_step: filters.hour_step.toString(),
      item_fg: filters.item_fg,
    })

    if (filters.prod_pool) {
      queryParams.append("prod_pool", filters.prod_pool)
    }

    if (filters.detail_index) {
      queryParams.append("detail_index", filters.detail_index.toString())
    }

    let path = "/api/report/laminate"
    if (activeProcessType.value === "Printing") {
      path = "/api/report/printing"
    } else if (activeProcessType.value === "BlownFilm") {
      path = "/api/report/blownfilm"
    }

    const res = await fetch(`${BACKEND_API_BASE_URL}${path}?${queryParams.toString()}`)

    if (!res.ok) {
      const errData = await res.json().catch(() => null)
      throw new Error(errData?.detail || `Server returned status ${res.status}`)
    }

    const data = await res.json()
    reportData.value = data
  } catch (err) {
    console.error("Fetch report error:", err)
    reportData.value = null
    errorMessage.value = err.message
  } finally {
    isLoading.value = false
  }
}

const fetchChart = async () => {
  if (!["Laminate", "Printing", "BlownFilm"].includes(activeProcessType.value)) {
    errorMessage.value = `ระบบกราฟสำหรับกระบวนการ ${activeProcessType.value} (${currentMachineObj.value?.name || filters.machineId}) อยู่ระหว่างการพัฒนาระบบ`
    return
  }

  const dateErr = validateDateRange(filters.date_from, filters.date_to, 31)
  if (dateErr) {
    errorMessage.value = dateErr
    return
  }

  isLoading.value = true
  errorMessage.value = ""
  loadFirstTime.value = false

  try {
    const queryParams = new URLSearchParams({
      machine: filters.machineId,
      date_from: filters.date_from,
      date_to: filters.date_to,
      time_from: filters.time_from,
      time_to: filters.time_to,
    })

    const path = `/api/chart/${activeProcessType.value.toLowerCase()}`
    const res = await fetch(`${BACKEND_API_BASE_URL}${path}?${queryParams.toString()}`)

    if (!res.ok) {
      const errData = await res.json().catch(() => null)
      throw new Error(errData?.detail || `Server returned status ${res.status}`)
    }

    const data = await res.json()
    chartData.value = data
  } catch (err) {
    console.error("Fetch chart error:", err)
    chartData.value = null
    errorMessage.value = err.message
  } finally {
    isLoading.value = false
  }
}

const handleSearch = () => {
  if (viewMode.value === "report") {
    fetchReport()
  } else {
    fetchChart()
  }
}

const setViewMode = (mode) => {
  viewMode.value = mode
  // If switching to chart mode and chart data is not yet fetched, fetch it automatically if user had already searched once
  clearErrorMessage()
  if (mode === "chart" && !chartData.value && !loadFirstTime.value) {
    fetchChart()
  } else if (mode === "report" && !reportData.value && !loadFirstTime.value) {
    fetchReport()
  }
}

const clearErrorMessage = () => {
  errorMessage.value = ""
}

const printReport = () => {
  window.print()
}

// let machineStatusAbortController = null

const fetchMachineStatus = async () => {
  // if (machineStatusAbortController) {
  //   machineStatusAbortController.abort()
  // }
  // machineStatusAbortController = new AbortController()
  // machineStatus.value.status = "Loading"
  // try {
  //   const queryParams = new URLSearchParams({
  //     machine: filters.machineId,
  //   })
  //   const res = await fetch(BACKEND_API_BASE_URL + "/api/machineStatus?" + queryParams.toString(), {
  //     signal: machineStatusAbortController.signal,
  //   })
  //   if (!res.ok) {
  //     throw new Error(`Server returned status ${res.status}`)
  //   }
  //   const data = await res.json()
  //   if (data.status === "N/A" || data.message?.includes("No MES")) {
  //     machineStatus.value.status = "N/A"
  //   } else {
  //     machineStatus.value.status = data.status.toString() == "1" ? "Online" : "Offline"
  //   }
  //   machineStatus.value.time = data.updateTime ? data.updateTime.toString() : ""
  // } catch (err) {
  //   if (err.name === "AbortError") {
  //     return
  //   }
  //   console.warn("Could not fetch machine status:", err)
  //   machineStatus.value.status = "Error"
  //   machineStatus.value.time = ""
  // }
}

watch(
  () => filters.machineId,
  (newId) => {
    if (newId) {
      // fetchMachineStatus()
    }
  },
)

onMounted(async () => {
  await fetchMachines()
  // fetchMachineStatus()
})
</script>
