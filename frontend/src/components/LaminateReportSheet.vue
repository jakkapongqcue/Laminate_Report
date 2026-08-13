<template>
  <div class="report-page">
    
    <!-- Report Header Section -->
    <div class="flex justify-between items-start mb-3 pb-2 border-b border-gray-300">
      
      <!-- Company Logo & Brand -->
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 bg-sky-800 text-white rounded flex items-center justify-center font-bold text-xs tracking-wider">
          STARFLEX
        </div>
        <div>
          <div class="text-[10px] uppercase font-bold text-gray-500 tracking-wider">STARFLEX PUBLIC COMPANY LIMITED</div>
          <div class="text-xs font-bold text-gray-800">ฝ่ายประกันคุณภาพ (Quality Assurance)</div>
        </div>
      </div>

      <!-- Main Report Title -->
      <div class="text-center">
        <h1 class="text-xl font-bold uppercase tracking-wide text-gray-900">
          LAMINATE CHECKING REPORT
        </h1>
      </div>

      <!-- Page Indicator -->
      <div class="text-right text-xs font-semibold text-gray-700">
        Page: <span class="text-sm font-bold text-gray-900">{{ pageData.page_number }}</span> / {{ pageData.total_pages }}
      </div>
    </div>

    <!-- Metadata Filter Summary Header Row -->
    <div class="grid grid-cols-12 gap-2 text-xs mb-3 font-medium">
      <div class="col-span-4 flex items-center gap-2">
        <span class="font-bold">เครื่องเคลือบ:</span>
        <span class="px-2 py-0.5 bg-gray-100 rounded border border-gray-300 font-semibold">{{ machine }}</span>
      </div>

      <div class="col-span-4 flex items-center gap-2">
        <span class="font-bold">วันที่:</span>
        <span class="px-2 py-0.5 bg-gray-100 rounded border border-gray-300">{{ pageData.date_str }}</span>
        <span>ถึง</span>
        <span class="px-2 py-0.5 bg-gray-100 rounded border border-gray-300">{{ dateTo }}</span>
      </div>

      <div class="col-span-4 flex items-center gap-2">
        <span class="font-bold">เวลา:</span>
        <span class="px-2 py-0.5 bg-gray-100 rounded border border-gray-300">{{ timeFrom }}</span>
        <span>ถึง</span>
        <span class="px-2 py-0.5 bg-gray-100 rounded border border-gray-300">{{ timeTo }}</span>
      </div>
    </div>

    <!-- Parameter Table Component -->
    <ParameterTable 
      :time-columns="pageData.time_columns"
      :rows="pageData.rows"
    />

    <!-- Footer Section -->
    <div class="mt-4 pt-2 text-xs">
      <!-- Remark line -->
      <div class="flex items-center gap-2 mb-6">
        <span class="font-bold">Remark:</span>
        <input 
          type="text" 
          v-model="remark" 
          placeholder="ระบุหมายเหตุเพิ่มเติม (ถ้ามี)...................................................................................................." 
          class="flex-1 border-b border-dotted border-gray-500 focus:outline-none bg-transparent px-1"
        />
      </div>

      <!-- Signatures Block -->
      <div class="flex justify-between items-center px-12 pt-2">
        <!-- Recorder Signature -->
        <div class="flex flex-col items-start gap-1">
          <div class="flex items-center gap-2">
            <span>ผู้บันทึก:</span>
            <span class="border-b border-gray-400 w-48 block h-5"></span>
          </div>
          <div class="flex items-center gap-2 mt-1">
            <span>วันที่:</span>
            <span class="border-b border-gray-400 w-36 block h-5 text-center">{{ pageData.date_str }}</span>
          </div>
        </div>

        <!-- Reviewer Signature -->
        <div class="flex flex-col items-start gap-1">
          <div class="flex items-center gap-2">
            <span>ผู้ทบทวน:</span>
            <span class="border-b border-gray-400 w-48 block h-5"></span>
          </div>
          <div class="flex items-center gap-2 mt-1">
            <span>วันที่:</span>
            <span class="border-b border-gray-400 w-36 block h-5 text-center">{{ pageData.date_str }}</span>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref } from 'vue'
import ParameterTable from './ParameterTable.vue'

const props = defineProps({
  pageData: {
    type: Object,
    required: true
  },
  machine: {
    type: String,
    default: '2LB-06 FujiKikai'
  },
  dateFrom: {
    type: String,
    default: ''
  },
  dateTo: {
    type: String,
    default: ''
  },
  timeFrom: {
    type: String,
    default: ''
  },
  timeTo: {
    type: String,
    default: ''
  }
})

const remark = ref('')
</script>
