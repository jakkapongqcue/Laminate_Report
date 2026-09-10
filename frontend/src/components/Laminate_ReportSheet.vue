<template>
  <div class="report-page">
    <!-- ── Report Header ───────────────────────────────────────────────── -->
    <div class="flex items-start justify-between pb-1">
      <!-- Company Logo & Brand -->
      <div class="flex items-center">
        <div class="starflexLogo w-20 h-16"></div>
        <div></div>
      </div>

      <!-- Main Report Title -->
      <div class="self-center text-center">
        <h1 class="text-base font-bold tracking-wide text-gray-900 uppercase">
          LAMINATE CHECKING REPORT
        </h1>
      </div>

      <!-- Page Indicator -->
      <div class="text-right text-[9px] font-semibold text-gray-700 self-center w-20">
        Page:
        <span class="text-xs font-bold text-gray-900">{{ pageData.page_number }}</span>
        / {{ pageData.total_pages }}
      </div>
    </div>

    <!-- ── Metadata Row ─────────────────────────────────────────────────── -->
    <div class="flex gap-2 text-[9px] mb-1 font-medium">
      <div class="flex items-center gap-1">
        <span class="font-bold">FG Code:</span>
        <span class="px-1 py-0.5 rounded font-semibold">{{ itemFg || '-' }}</span>
      </div>
      <div class="flex items-center gap-1">
        <span class="font-bold">เครื่องเคลือบ:</span>
        <span class="px-1 py-0.5 rounded font-semibold">{{ machine }}</span>
      </div>
      <div class="flex items-center gap-1">
        <span class="font-bold">วันที่:</span>
        <span class="px-1 py-0.5 rounded"> {{ formatDate(dateFrom) }}</span>
        <span class="px-1 py-0.5 rounded"> {{ formatTime(timeFrom) }}</span>
        <span class="font-bold self-center">ถึง</span>
        <span v-if="dateFrom !== dateTo" class="px-1 py-0.5 rounded">{{ formatDate(dateTo) }}</span>
        <span class="px-1 py-0.5 rounded"> {{ formatTime(timeTo) }}</span>
      </div>
    </div>

    <!-- ── Parameter Table (fills remaining height) ─────────────────────── -->
    <div class="flex-1">
      <Laminate_ParameterTable :time-columns="pageData.time_columns" :rows="pageData.rows" />
    </div>

    <!-- ── Footer ──────────────────────────────────────────────────────── -->
    <div class="text-[9px] pt-4">
      <!-- Signatures Block -->
      <div class="flex items-center">
        <!-- Reviewer -->
        <div class="flex flex-col w-40 gap-3 ml-auto">
          <div class="flex items-center gap-2">
            <span class="text-nowrap">ผู้ทบทวน:</span>
            <span class="block w-full h-4 border-b border-gray-400"></span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-nowrap">วันที่:</span>
            <span class="block w-full h-4 text-center border-b border-gray-400"> </span>
          </div>
        </div>
      </div>

      <!-- Paper version -->
      <div>
        <span>FM-PRD-01/55 Rev.05 Effective Date : 01/11/2024</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import Laminate_ParameterTable from './Laminate_ParameterTable.vue'

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d)) return dateStr
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
}

function formatTime(timeStr) {
  return timeStr + ' น.'
}

const props = defineProps({
  pageData: {
    type: Object,
    required: true,
  },
  machine: {
    type: String,
    default: '1LB09_Bobst',
  },
  itemFg: {
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

const remark = ref('')
</script>

<style lang="css" scoped>
.starflexLogo {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' width='140' height='140' viewBox='0 0 140 140'%3E%3Cimage xlink:href='data:image/png;base64,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");
  background-size: auto 64px;
  background-repeat: no-repeat;
}
</style>
