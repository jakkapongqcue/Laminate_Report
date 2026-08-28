<template>
  <div class="report-page">
    <!-- ── Report Header ───────────────────────────────────────────────── -->
    <div class="flex items-start justify-between pb-1 mb-1 border-b border-gray-400">
      <!-- Company Logo & Brand -->
      <div class="flex items-center gap-2" :class="customClass">
        <!-- <div
          class="w-8 h-8 bg-sky-800 text-white rounded flex items-center justify-center font-bold text-[9px] tracking-wider leading-tight text-center"
        >
          STAR<br />FLEX
        </div> -->
        <img src="../assets/SFLEX.png" alt="SFLEX_logo" class="w-auto h-16" />
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
      <div
        class="text-right text-[9px] font-semibold text-gray-700 self-center"
        :class="customClass"
      >
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
        <span>ถึง</span>
        <span class="px-1 py-0.5 rounded border border-gray-300"> {{ formatDate(dateTo) }}</span>
      </div>
      <div class="flex items-center gap-1">
        <span class="font-bold">เวลา:</span>
        <span class="px-1 py-0.5 rounded border border-gray-300"> {{ timeFrom }}</span>
        <span>ถึง</span>
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

const customClass = 'w-20'

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
