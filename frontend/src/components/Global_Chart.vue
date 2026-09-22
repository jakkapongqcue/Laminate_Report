<template>
  <div class="space-y-4">
    <!-- ── Parameter Selection Panel ─────────────────────────────────── -->
    <div class="no-print rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div class="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-3">
        <div class="flex items-center gap-2">
          <span class="inline-flex h-6 w-6 items-center justify-center rounded-full bg-sky-100 text-xs font-bold text-sky-700">
            {{ selectedParamKeys.length }}
          </span>
          <h3 class="text-sm font-bold text-gray-800">เลือกพารามิเตอร์ที่ต้องการแสดงบนกราฟ (Select Parameters)</h3>
          <span class="text-xs text-gray-400">| รวม {{ availableParams.length }} ตัวแปร</span>
        </div>

        <!-- Quick Controls -->
        <div class="flex flex-wrap items-center gap-2 text-xs">
          <button
            type="button"
            @click="selectAllParams"
            class="rounded border border-gray-200 bg-gray-100 px-2.5 py-1 text-gray-700 transition hover:bg-sky-50 hover:text-sky-700"
          >
            เลือกทั้งหมด
          </button>
          <button
            type="button"
            @click="clearAllParams"
            class="rounded border border-gray-200 bg-gray-100 px-2.5 py-1 text-gray-700 transition hover:bg-red-50 hover:text-red-700"
          >
            ล้างการเลือก
          </button>
          <button type="button" @click="resetToDefaultParams" class="rounded border border-gray-200 bg-gray-100 px-2.5 py-1 text-gray-700 transition hover:bg-gray-200">
            ค่าเริ่มต้น
          </button>
          <button
            type="button"
            @click="saveAsDefaultParams"
            class="inline-flex w-32 items-center justify-center gap-1 rounded bg-sky-600 px-3 py-1 font-medium text-white shadow-sm transition hover:bg-sky-700"
          >
            <svg v-if="saveSuccess" class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            <span>{{ saveSuccess ? "บันทึกสำเร็จ!" : "บันทึกเป็นค่าเริ่มต้น" }}</span>
          </button>
        </div>
      </div>

      <!-- Categories & Checkbox Pills -->
      <div class="space-y-3 pt-3">
        <div v-for="cat in paramCategories" :key="cat.name" class="flex flex-wrap items-center gap-1.5">
          <span class="w-36 shrink-0 text-xs font-semibold text-gray-500"> {{ cat.label }}: </span>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="p in cat.params"
              :key="p.key"
              type="button"
              @click="toggleParam(p.key)"
              :class="[
                'flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-all',
                selectedParamKeys.includes(p.key) ? 'border-sky-600 bg-sky-600 text-white shadow-sm' : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100',
              ]"
            >
              <span>{{ p.name }}</span>
              <span v-if="p.unit" :class="['text-[10px]', selectedParamKeys.includes(p.key) ? 'text-sky-100' : 'text-gray-400']"> ({{ p.unit }}) </span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Main Chart Area ─────────────────────────────────────────── -->
    <div class="rounded-lg border border-gray-200 bg-white p-5 shadow-md">
      <!-- Chart Controls Header -->
      <div class="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-3">
        <div class="flex items-center gap-2">
          <div class="rounded-md bg-sky-100 p-1.5 text-sky-700">
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <div>
            <h2 class="text-base font-bold text-gray-900">กราฟแสดงแนวโน้มพารามิเตอร์ (Parameter Trend Chart)</h2>
            <p class="text-xs text-gray-500">
              เครื่องจักร: <span class="font-semibold text-gray-700">{{ machine }}</span> | ช่วงเวลา: {{ dateFrom }} {{ timeFrom }} น. ถึง {{ dateTo }} {{ timeTo }} น.
              <span v-if="chartData && chartData.total_data_points" class="ml-1 font-medium text-sky-600"> ({{ chartData.total_data_points }} จุดข้อมูล) </span>
            </p>
          </div>
        </div>
      </div>

      <!-- No parameters selected warning -->
      <div v-if="selectedParamKeys.length === 0" class="rounded-lg border border-dashed border-gray-300 bg-gray-50 py-16 text-center text-gray-500">
        <p class="text-sm font-semibold text-gray-700">ยังไม่ได้เลือกพารามิเตอร์เพื่อแสดงในกราฟ</p>
        <p class="mt-1 text-xs text-gray-500">กรุณาคลิกเลือกพารามิเตอร์ด้านบน หรือกดปุ่ม "เลือกทั้งหมด"</p>
      </div>

      <!-- ApexCharts Component -->
      <div v-else class="w-full">
        <VueApexCharts v-if="chartSeries.length > 0" type="line" height="450" :options="chartOptions" :series="chartSeries" />
        <div v-else class="rounded-lg border border-dashed border-gray-200 py-16 text-center text-gray-500">
          <p class="text-sm font-medium">ไม่พบข้อมูลตัวเลขสำหรับพารามิเตอร์ที่เลือกในช่วงเวลานี้</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue"
import VueApexCharts from "vue3-apexcharts"

const props = defineProps({
  chartData: {
    type: Object,
    default: () => null,
  },
  machine: {
    type: String,
    default: "",
  },
  dateFrom: {
    type: String,
    default: "",
  },
  dateTo: {
    type: String,
    default: "",
  },
  timeFrom: {
    type: String,
    default: "",
  },
  timeTo: {
    type: String,
    default: "",
  },
  processType: {
    type: String,
    default: "Laminate",
  },
})

const storageKey = computed(() => {
  const p = (props.processType || "default").toLowerCase()
  return `${p}-report-chart-default-params`
})

// Built-in standard default parameters mapping
const INITIAL_DEFAULTS_BY_PROCESS = {
  laminate: ["LINE_SPEED", "TEMP_ZONE_1", "TEMP_ZONE_2", "TENSION_UNWIND_1", "TENSION_REWIND"],
  printing: ["LINE_SPEED", "TOTAL_length", "RewingA_length", "UnwingA_length"],
}

const selectedParamKeys = ref([])
const curveType = ref("straight")
const saveSuccess = ref(false)

// Available parameters from chartData
const availableParams = computed(() => {
  if (!props.chartData || !props.chartData.parameters) return []
  return props.chartData.parameters.filter((p) => p.type === "numeric")
})

// Group available parameters by category
const paramCategories = computed(() => {
  const categories = [
    { name: "Speed", label: "ความเร็ว (Speed)", params: [] },
    { name: "Length", label: "ความยาว (Length)", params: [] },
    { name: "Temperature", label: "อุณหภูมิ (Temp)", params: [] },
    { name: "Tension", label: "แรงตึง (Tension)", params: [] },
    { name: "Pressure", label: "แรงดัน (Pressure)", params: [] },
    { name: "Corona", label: "โคโรนา (Corona)", params: [] },
    { name: "Roll & Work", label: "หน่วยพิมพ์ (Roll & Work)", params: [] },
  ]

  for (const p of availableParams.value) {
    const cat = categories.find((c) => c.name.toLowerCase() === (p.category || "").toLowerCase())
    if (cat) {
      cat.params.push(p)
    } else {
      let otherCat = categories.find((c) => c.name === "Other")
      if (!otherCat) {
        otherCat = { name: "Other", label: "พารามิเตอร์ทั่วไป (General)", params: [] }
        categories.push(otherCat)
      }
      otherCat.params.push(p)
    }
  }

  return categories.filter((c) => c.params.length > 0)
})

// Toggle individual parameter
const toggleParam = (key) => {
  const idx = selectedParamKeys.value.indexOf(key)
  if (idx > -1) {
    selectedParamKeys.value.splice(idx, 1)
  } else {
    selectedParamKeys.value.push(key)
  }
}

// Quick selection helpers
const selectAllParams = () => {
  selectedParamKeys.value = availableParams.value.map((p) => p.key)
}

const clearAllParams = () => {
  selectedParamKeys.value = []
}

const getDefaultParamKeys = () => {
  const pKey = (props.processType || "").toLowerCase()
  if (INITIAL_DEFAULTS_BY_PROCESS[pKey]) {
    return INITIAL_DEFAULTS_BY_PROCESS[pKey]
  }
  // Fallback: pick first 5 available params
  return availableParams.value.slice(0, 5).map((p) => p.key)
}

const resetToDefaultParams = () => {
  const saved = localStorage.getItem(storageKey.value)
  if (saved) {
    try {
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed) && parsed.length > 0) {
        selectedParamKeys.value = [...parsed]
        return
      }
    } catch (e) {
      console.warn("Error parsing saved defaults:", e)
    }
  }
  selectedParamKeys.value = [...getDefaultParamKeys()]
}

const saveAsDefaultParams = () => {
  localStorage.setItem(storageKey.value, JSON.stringify(selectedParamKeys.value))
  saveSuccess.value = true
  setTimeout(() => {
    saveSuccess.value = false
  }, 2000)
}

// Load default settings on mount or data changes
const loadDefaults = () => {
  const saved = localStorage.getItem(storageKey.value)
  if (saved) {
    try {
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed) && parsed.length > 0) {
        selectedParamKeys.value = parsed
        return
      }
    } catch (e) {
      console.warn("Error reading saved chart defaults:", e)
    }
  }
  selectedParamKeys.value = [...getDefaultParamKeys()]
}

watch(
  () => props.chartData,
  () => {
    if (selectedParamKeys.value.length === 0) {
      loadDefaults()
    }
  },
  { immediate: true },
)

watch(
  () => props.processType,
  () => {
    loadDefaults()
  },
)

onMounted(() => {
  loadDefaults()
})

// Prepare series for ApexCharts
const chartSeries = computed(() => {
  if (!props.chartData || !props.chartData.parameters) return []

  const series = []
  for (const key of selectedParamKeys.value) {
    const param = props.chartData.parameters.find((p) => p.key === key)
    if (param && param.data && param.data.length > 0) {
      const unitLabel = param.unit ? ` (${param.unit})` : ""
      series.push({
        name: `${param.name}${unitLabel}`,
        data: param.data.map((pt) => ({
          x: pt.x,
          y: pt.y,
        })),
      })
    }
  }
  return series
})

// Dynamic ApexCharts options
const chartOptions = computed(() => {
  return {
    chart: {
      type: "line",
      height: 450,
      fontFamily: "Sarabun, sans-serif",
      zoom: {
        enabled: true,
        type: "x",
        autoScaleYaxis: true,
      },
      toolbar: {
        autoSelected: "zoom",
        show: true,
        tools: {
          download: true,
          selection: true,
          zoom: true,
          zoomin: true,
          zoomout: true,
          pan: true,
          reset: true,
        },
      },
      animations: { enabled: (props.chartData?.total_data_points || 0) < 300 },
    },
    stroke: {
      curve: curveType.value,
      width: 2,
    },
    colors: [
      "#0284c7", // Sky 600
      "#10b981", // Emerald 500
      "#f59e0b", // Amber 500
      "#ef4444", // Red 500
      "#8b5cf6", // Violet 500
      "#ec4899", // Pink 500
      "#06b6d4", // Cyan 500
      "#14b8a6", // Teal 500
      "#f97316", // Orange 500
      "#6366f1", // Indigo 500
      "#84cc16", // Lime 500
      "#d946ef", // Fuchsia 500
    ],
    markers: {
      size: 0,
      hover: {
        size: 6,
      },
    },
    xaxis: {
      type: "category",
      labels: {
        rotate: -30,
        rotateAlways: false,
        style: {
          fontSize: "11px",
          colors: "#64748b",
        },
        formatter: function (val) {
          if (!val) return ""
          if (typeof val === "string" && val.includes(" ")) {
            const parts = val.split(" ")
            const timePart = parts[1].slice(0, 5)
            const datePart = parts[0].split("-")
            if (datePart.length === 3) {
              return `${datePart[2]}/${datePart[1]}/${datePart[0].slice(2, 4)} ${timePart}`
            }
            return timePart
          }
          return val
        },
      },
      axisBorder: {
        color: "#cbd5e1",
      },
      axisTicks: {
        color: "#cbd5e1",
      },
    },
    yaxis: {
      title: {
        text: "ค่าที่วัดได้ (Value)",
        style: {
          fontSize: "12px",
          fontWeight: 600,
          color: "#475569",
        },
      },
      labels: {
        style: {
          fontSize: "11px",
          colors: "#64748b",
        },
      },
    },
    tooltip: {
      shared: true,
      intersect: false,
      theme: "light",
      x: {
        formatter: function (val) {
          return `เวลา: ${val}`
        },
      },
    },
    grid: {
      borderColor: "#f1f5f9",
      strokeDashArray: 3,
    },
    legend: {
      position: "top",
      horizontalAlign: "left",
      fontSize: "12px",
      markers: {
        width: 10,
        height: 10,
        radius: 2,
      },
    },
    noData: {
      text: "ไม่มีข้อมูลแสดงผล",
      style: {
        fontSize: "14px",
        color: "#94a3b8",
      },
    },
  }
})
</script>
