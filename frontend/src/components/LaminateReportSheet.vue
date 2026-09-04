<template>
  <div class="report-page">
    <!-- ── Report Header ───────────────────────────────────────────────── -->
    <div class="flex items-start justify-between pb-1 mb-1 border-b border-gray-400">
      <!-- Company Logo & Brand -->
      <div class="flex items-center">
        <!-- <div
          class="w-8 h-8 bg-sky-800 text-white rounded flex items-center justify-center font-bold text-[9px] tracking-wider leading-tight text-center"
        >
          STAR<br />FLEX
        </div> -->
        <!-- <img src="../assets/SFLEX.png" alt="SFLEX_logo" class="w-auto h-16" /> -->
        <div class="starflexLogo w-20 h-16"></div>
        <div>
          <!-- <div
            class="text-[8px] uppercase font-bold text-gray-500 tracking-wider"
          >
            STARFLEX PUBLIC COMPANY LIMITED
          </div>
          <div class="text-[9px] font-bold text-gray-800">
            ฝ่ายประกันคุณภาพ (Quality Assurance)
          </div> -->
        </div>
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
    <div class="flex gap-4 text-[9px] mb-1 font-medium">
      <div class="flex items-center gap-1">
        <span class="font-bold">เครื่องเคลือบ:</span>
        <span class="px-1 py-0.5 rounded border border-gray-300 font-semibold">{{ machine }}</span>
      </div>
      <div class="flex items-center gap-1">
        <span class="font-bold">วันที่:</span>
        <span class="px-1 py-0.5 rounded border border-gray-300"> {{ pageData.date_str }}</span>
        <span class="px-1 py-0.5 rounded border border-gray-300"> {{ timeFrom }}</span>
      </div>
      <span class="font-bold self-center">ถึง</span>
      <div class="flex items-center gap-1">
        <span class="px-1 py-0.5 rounded border border-gray-300"> {{ formatDate(dateTo) }}</span>
        <span class="px-1 py-0.5 rounded border border-gray-300"> {{ timeTo }}</span>
      </div>
    </div>

    <!-- ── Parameter Table (fills remaining height) ─────────────────────── -->
    <div class="flex-1">
      <ParameterTable :time-columns="pageData.time_columns" :rows="pageData.rows" />
    </div>

    <!-- ── Footer ──────────────────────────────────────────────────────── -->
    <div class="text-[9px] pt-4">
      <!-- Remark line -->
      <div class="flex items-center gap-2 pb-3">
        <span class="font-bold whitespace-nowrap">Remark:</span>
        <input
          type="text"
          v-model="remark"
          placeholder=""
          class="flex-1 border-b border-dotted border-gray-500 focus:outline-none bg-transparent px-1 text-[9px]"
        />
      </div>

      <!-- Signatures Block -->
      <div class="flex items-center">
        <!-- Recorder -->
        <!-- <div class="flex flex-col w-40 gap-3">
          <div class="flex items-center gap-2">
            <span class="text-nowrap">ผู้บันทึก:</span>
            <span class="block w-full h-4 border-b border-gray-400"></span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-nowrap">วันที่:</span>
            <span class="block w-full h-4 text-center border-b border-gray-400">
            </span>
          </div>
        </div> -->

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
import ParameterTable from './ParameterTable.vue'

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d)) return dateStr
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
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
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' width='140' height='140' viewBox='0 0 140 140'%3E%3Cimage xlink:href='data:image/png;base64,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' x='0' y='0' width='140' height='140'/%3E%3C/svg%3E");
  background-size: auto 64px;
  background-repeat: no-repeat;
}
</style>
