<template>
  <div class="report-page">
    <!-- ── Report Header ───────────────────────────────────────────────── -->
    <div
      class="flex justify-between items-start mb-1 pb-1 border-b border-gray-400"
    >
      <!-- Company Logo & Brand -->
      <div class="flex items-center gap-2">
        <div
          class="w-8 h-8 bg-sky-800 text-white rounded flex items-center justify-center font-bold text-[9px] tracking-wider leading-tight text-center"
        >
          STAR<br />FLEX
        </div>
        <div>
          <div
            class="text-[8px] uppercase font-bold text-gray-500 tracking-wider"
          >
            STARFLEX PUBLIC COMPANY LIMITED
          </div>
          <div class="text-[9px] font-bold text-gray-800">
            ฝ่ายประกันคุณภาพ (Quality Assurance)
          </div>
        </div>
      </div>

      <!-- Main Report Title -->
      <div class="text-center">
        <h1 class="text-base font-bold uppercase tracking-wide text-gray-900">
          LAMINATE CHECKING REPORT
        </h1>
      </div>

      <!-- Page Indicator -->
      <div class="text-right text-[9px] font-semibold text-gray-700">
        Page:
        <span class="text-xs font-bold text-gray-900">{{
          pageData.page_number
        }}</span>
        / {{ pageData.total_pages }}
      </div>
    </div>

    <!-- ── Metadata Row ─────────────────────────────────────────────────── -->
    <div class="flex gap-4 text-[9px] mb-1 font-medium">
      <div class="flex items-center gap-1">
        <span class="font-bold">เครื่องเคลือบ:</span>
        <span
          class="px-1 py-0.5 bg-gray-100 rounded border border-gray-300 font-semibold"
          >{{ machine }}</span
        >
      </div>
      <div class="flex items-center gap-1">
        <span class="font-bold">วันที่:</span>
        <span class="px-1 py-0.5 bg-gray-100 rounded border border-gray-300">{{
          pageData.date_str
        }}</span>
        <span>ถึง</span>
        <span class="px-1 py-0.5 bg-gray-100 rounded border border-gray-300">{{
          dateTo
        }}</span>
      </div>
      <div class="flex items-center gap-1">
        <span class="font-bold">เวลา:</span>
        <span class="px-1 py-0.5 bg-gray-100 rounded border border-gray-300">{{
          timeFrom
        }}</span>
        <span>ถึง</span>
        <span class="px-1 py-0.5 bg-gray-100 rounded border border-gray-300">{{
          timeTo
        }}</span>
      </div>
    </div>

    <!-- ── Parameter Table (fills remaining height) ─────────────────────── -->
    <div class="flex-1 overflow-hidden">
      <ParameterTable
        :time-columns="pageData.time_columns"
        :rows="pageData.rows"
      />
    </div>

    <!-- ── Footer ──────────────────────────────────────────────────────── -->
    <div class="text-[9px]">
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
      <div class="flex justify-around items-center pb-4">
        <!-- Recorder -->
        <div class="flex flex-col gap-3 w-40">
          <div class="flex items-center gap-2">
            <span class="text-nowrap">ผู้บันทึก:</span>
            <span class="border-b border-gray-400 w-full block h-4"></span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-nowrap">วันที่:</span>
            <span class="border-b border-gray-400 w-full block h-4 text-center">
            </span>
          </div>
        </div>

        <!-- Reviewer -->
        <div class="flex flex-col gap-3 w-40">
          <div class="flex items-center gap-2">
            <span class="text-nowrap">ผู้ทบทวน:</span>
            <span class="border-b border-gray-400 w-full block h-4"></span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-nowrap">วันที่:</span>
            <span class="border-b border-gray-400 w-full block h-4 text-center">
            </span>
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
import { ref } from "vue";
import ParameterTable from "./ParameterTable.vue";

const props = defineProps({
  pageData: {
    type: Object,
    required: true,
  },
  machine: {
    type: String,
    default: "1LB09_Bobst",
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
});

const remark = ref("");
</script>
