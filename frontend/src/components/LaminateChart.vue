<template>
  <div class="space-y-4">
    <!-- ── Parameter Selection Panel ─────────────────────────────────── -->
    <div class="p-4 bg-white border border-gray-200 rounded-lg shadow-sm no-print">
      <div class="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-gray-100">
        <div class="flex items-center gap-2">
          <span
            class="inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-sky-700 bg-sky-100 rounded-full"
          >
            {{ selectedParamKeys.length }}
          </span>
          <h3 class="text-sm font-bold text-gray-800">
            เลือกพารามิเตอร์ที่ต้องการแสดงบนกราฟ (Select Parameters)
          </h3>
          <span class="text-xs text-gray-400">| รวม {{ availableParams.length }} ตัวแปร</span>
        </div>

        <!-- Quick Controls -->
        <div class="flex flex-wrap items-center gap-2 text-xs">
          <button
            type="button"
            @click="selectAllParams"
            class="px-2.5 py-1 text-gray-700 bg-gray-100 border border-gray-200 rounded hover:bg-sky-50 hover:text-sky-700 transition"
          >
            เลือกทั้งหมด
          </button>
          <button
            type="button"
            @click="clearAllParams"
            class="px-2.5 py-1 text-gray-700 bg-gray-100 border border-gray-200 rounded hover:bg-red-50 hover:text-red-700 transition"
          >
            ล้างการเลือก
          </button>
          <button
            type="button"
            @click="resetToDefaultParams"
            class="px-2.5 py-1 text-gray-700 bg-gray-100 border border-gray-200 rounded hover:bg-gray-200 transition"
          >
            ค่าเริ่มต้น
          </button>
          <button
            type="button"
            @click="saveAsDefaultParams"
            class="inline-flex items-center gap-1 px-3 py-1 font-medium text-white transition rounded shadow-sm bg-sky-600 hover:bg-sky-700"
          >
            <svg
              v-if="saveSuccess"
              class="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span>{{ saveSuccess ? 'บันทึกสำเร็จ!' : 'บันทึกเป็นค่าเริ่มต้น' }}</span>
          </button>
        </div>
      </div>

      <!-- Categories & Checkbox Pills -->
      <div class="pt-3 space-y-3">
        <div
          v-for="cat in paramCategories"
          :key="cat.name"
          class="flex flex-wrap items-center gap-1.5"
        >
          <span class="w-24 text-xs font-semibold text-gray-500 shrink-0"> {{ cat.label }}: </span>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="p in cat.params"
              :key="p.key"
              type="button"
              @click="toggleParam(p.key)"
              :class="[
                'px-2.5 py-1 text-xs font-medium rounded-full border transition-all flex items-center gap-1.5',
                selectedParamKeys.includes(p.key)
                  ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                  : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100',
              ]"
            >
              <span>{{ p.name }}</span>
              <span
                :class="[
                  'text-[10px]',
                  selectedParamKeys.includes(p.key) ? 'text-sky-100' : 'text-gray-400',
                ]"
              >
                ({{ p.unit }})
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Main Chart Area ─────────────────────────────────────────── -->
    <div class="p-5 bg-white border border-gray-200 rounded-lg shadow-md">
      <!-- Chart Controls Header -->
      <div
        class="flex flex-wrap items-center justify-between gap-3 pb-3 mb-4 border-b border-gray-100"
      >
        <div class="flex items-center gap-2">
          <div class="p-1.5 bg-sky-100 text-sky-700 rounded-md">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
              />
            </svg>
          </div>
          <div>
            <h2 class="text-base font-bold text-gray-900">
              กราฟแสดงแนวโน้มพารามิเตอร์ (Parameter Trend Chart)
            </h2>
            <p class="text-xs text-gray-500">
              เครื่องจักร: <span class="font-semibold text-gray-700">{{ machine }}</span> |
              ช่วงเวลา: {{ dateFrom }} {{ timeFrom }} น. ถึง {{ dateTo }} {{ timeTo }} น.
              <span
                v-if="chartData && chartData.total_data_points"
                class="ml-1 text-sky-600 font-medium"
              >
                ({{ chartData.total_data_points }} จุดข้อมูล)
              </span>
            </p>
          </div>
        </div>
      </div>

      <!-- No parameters selected warning -->
      <div
        v-if="selectedParamKeys.length === 0"
        class="py-16 text-center text-gray-500 border border-dashed border-gray-300 rounded-lg bg-gray-50"
      >
        <p class="text-sm font-semibold text-gray-700">ยังไม่ได้เลือกพารามิเตอร์เพื่อแสดงในกราฟ</p>
        <p class="mt-1 text-xs text-gray-500">
          กรุณาคลิกเลือกพารามิเตอร์ด้านบน หรือกดปุ่ม "เลือกทั้งหมด"
        </p>
      </div>

      <!-- ApexCharts Component -->
      <div v-else class="w-full">
        <VueApexCharts
          v-if="chartSeries.length > 0"
          type="line"
          height="450"
          :options="chartOptions"
          :series="chartSeries"
        />
        <div
          v-else
          class="py-16 text-center text-gray-500 border border-dashed border-gray-200 rounded-lg"
        >
          <p class="text-sm font-medium">ไม่พบข้อมูลตัวเลขสำหรับพารามิเตอร์ที่เลือกในช่วงเวลานี้</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import VueApexCharts from 'vue3-apexcharts'

const props = defineProps({
  chartData: {
    type: Object,
    default: () => null,
  },
  machine: {
    type: String,
    default: '',
  },
  dateFrom: {
    type: String,
    default: '',
  },
  dateTo: {
    type: String,
    default: '',
  },
  timeFrom: {
    type: String,
    default: '',
  },
  timeTo: {
    type: String,
    default: '',
  },
})

const STORAGE_KEY_DEFAULT_PARAMS = 'laminate-report-chart-default-params'

// Built-in standard default parameters
const INITIAL_DEFAULT_PARAMS = [
  'LINE_SPEED',
  'TEMP_ZONE_1',
  'TEMP_ZONE_2',
  'TENSION_UNWIND_1',
  'TENSION_REWIND',
]

const selectedParamKeys = ref([])
const curveType = ref('straight')
const saveSuccess = ref(false)

// Available parameters from chartData
const availableParams = computed(() => {
  if (!props.chartData || !props.chartData.parameters) return []
  return props.chartData.parameters.filter((p) => p.type === 'numeric')
})

// Group available parameters by category
const paramCategories = computed(() => {
  const categories = [
    { name: 'Speed', label: 'ความเร็ว (Speed)', params: [] },
    { name: 'Temperature', label: 'อุณหภูมิ (Temp)', params: [] },
    { name: 'Tension', label: 'แรงตึง (Tension)', params: [] },
    { name: 'Pressure', label: 'แรงดัน (Pressure)', params: [] },
    { name: 'Corona', label: 'โคโรนา (Corona)', params: [] },
  ]

  for (const p of availableParams.value) {
    const cat = categories.find((c) => c.name.toLowerCase() === (p.category || '').toLowerCase())
    if (cat) {
      cat.params.push(p)
    } else {
      let otherCat = categories.find((c) => c.name === 'Other')
      if (!otherCat) {
        otherCat = { name: 'Other', label: 'อื่นๆ (Other)', params: [] }
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

const resetToDefaultParams = () => {
  const saved = localStorage.getItem(STORAGE_KEY_DEFAULT_PARAMS)
  if (saved) {
    try {
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed) && parsed.length > 0) {
        selectedParamKeys.value = [...parsed]
        return
      }
    } catch (e) {
      console.warn('Error parsing saved defaults:', e)
    }
  }
  selectedParamKeys.value = [...INITIAL_DEFAULT_PARAMS]
}

const saveAsDefaultParams = () => {
  localStorage.setItem(STORAGE_KEY_DEFAULT_PARAMS, JSON.stringify(selectedParamKeys.value))
  saveSuccess.value = true
  setTimeout(() => {
    saveSuccess.value = false
  }, 2000)
}

// Load default settings on mount
const loadDefaults = () => {
  const saved = localStorage.getItem(STORAGE_KEY_DEFAULT_PARAMS)
  if (saved) {
    try {
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed) && parsed.length > 0) {
        selectedParamKeys.value = parsed
        return
      }
    } catch (e) {
      console.warn('Error reading saved chart defaults:', e)
    }
  }
  selectedParamKeys.value = [...INITIAL_DEFAULT_PARAMS]
}

// Prepare series for ApexCharts
const chartSeries = computed(() => {
  if (!props.chartData || !props.chartData.parameters) return []

  const series = []
  for (const key of selectedParamKeys.value) {
    const param = props.chartData.parameters.find((p) => p.key === key)
    if (param && param.data && param.data.length > 0) {
      series.push({
        name: `${param.name} (${param.unit})`,
        data: param.data.map((pt) => ({
          x: pt.x,
          y: pt.y,
        })),
      })
    }
  }
  return series
})

// Statistics for selected parameters
const selectedParamStats = computed(() => {
  if (!props.chartData || !props.chartData.parameters) return []
  return props.chartData.parameters
    .filter((p) => selectedParamKeys.value.includes(p.key) && p.stats)
    .map((p) => ({
      key: p.key,
      name: p.name,
      unit: p.unit,
      category: p.category,
      latest: p.stats.latest,
      min: p.stats.min,
      max: p.stats.max,
      avg: p.stats.avg,
      count: p.stats.count,
    }))
})

const markersSize = computed(() => {
  if (props.chartData) {
    const dataPoint = props.chartData.total_data_points
    if (dataPoint > 150) return 0
    if (dataPoint > 100) return 2
    if (dataPoint > 50) return 3
    if (dataPoint > 25) return 4
    return 0
  }
  return 0
})

// Dynamic ApexCharts options
const chartOptions = computed(() => {
  return {
    chart: {
      type: 'line',
      height: 450,
      fontFamily: 'Sarabun, sans-serif',
      zoom: {
        enabled: true,
        type: 'x',
        autoScaleYaxis: true,
      },
      toolbar: {
        autoSelected: 'zoom',
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
      animations: { enabled: props.chartData.total_data_points < 300 },
    },
    stroke: {
      curve: curveType.value,
      width: 1.5,
    },
    colors: [
      '#0284c7', // Sky 600
      '#10b981', // Emerald 500
      '#f59e0b', // Amber 500
      '#ef4444', // Red 500
      '#8b5cf6', // Violet 500
      '#ec4899', // Pink 500
      '#06b6d4', // Cyan 500
      '#14b8a6', // Teal 500
      '#f97316', // Orange 500
      '#6366f1', // Indigo 500
      '#84cc16', // Lime 500
      '#d946ef', // Fuchsia 500
    ],
    markers: {
      size: 0,
      hover: {
        size: 6,
      },
    },
    xaxis: {
      type: 'category',
      labels: {
        rotate: -30,
        rotateAlways: false,
        style: {
          fontSize: '11px',
          colors: '#64748b',
        },
        formatter: function (val) {
          if (!val) return ''
          // If val is "YYYY-MM-DD HH:mm:ss", format to "DD/MM/YYYY HH:mm"
          if (typeof val === 'string' && val.includes(' ')) {
            const parts = val.split(' ')
            const timePart = parts[1].slice(0, 5)
            const datePart = parts[0].split('-')
            if (datePart.length === 3) {
              return `${datePart[2]}/${datePart[1]}/${datePart[0].slice(2, 4)} ${timePart}`
            }
            return timePart
          }
          return val
        },
      },
      axisBorder: {
        color: '#cbd5e1',
      },
      axisTicks: {
        color: '#cbd5e1',
      },
    },
    yaxis: {
      title: {
        text: 'ค่าที่วัดได้ (Value)',
        style: {
          fontSize: '12px',
          fontWeight: 600,
          color: '#475569',
        },
      },
      labels: {
        style: {
          fontSize: '11px',
          colors: '#64748b',
        },
      },
    },
    legend: {
      position: 'top',
      horizontalAlign: 'center',
      fontSize: '12px',
      fontFamily: 'Sarabun, sans-serif',
      markers: {
        radius: 12,
      },
      itemMargin: {
        horizontal: 8,
        vertical: 4,
      },
    },
    tooltip: {
      shared: true,
      intersect: false,
      theme: 'light',
      style: {
        fontSize: '12px',
        fontFamily: 'Sarabun, sans-serif',
      },
      x: {
        formatter: function (val, opts) {
          // ดึง Label จริงจาก w.globals ตาม dataPointIndex
          const label =
            opts?.w?.globals?.categoryLabels?.[opts?.dataPointIndex] ||
            opts?.w?.globals?.labels?.[opts?.dataPointIndex] ||
            val
          return `🕒 เวลา: ${label} น.`
        },
      },
    },
    grid: {
      // borderColor: '#e2e8f0',
      // strokeDashArray: 3,
      // xaxis: {
      //   lines: {
      //     show: true,
      //   },
      // },
      // yaxis: {
      //   lines: {
      //     show: true,
      //   },
      // },
    },
  }
})

// Keep defaults updated if available parameters change
watch(
  () => availableParams.value,
  (newParams) => {
    if (newParams.length > 0 && selectedParamKeys.value.length === 0) {
      loadDefaults()
    }
  },
  { immediate: true },
)

onMounted(() => {
  loadDefaults()
})
</script>
