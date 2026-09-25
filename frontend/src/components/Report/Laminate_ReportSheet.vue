<template>
  <div class="report-page">
    <!-- ── Report Header ───────────────────────────────────────────────── -->
    <div class="flex items-start justify-between pb-1">
      <!-- Company Logo & Brand -->
      <div class="flex items-center">
        <div class="starflexLogo h-16 w-20"></div>
        <div></div>
      </div>

      <!-- Main Report Title -->
      <div class="self-center text-center">
        <h1 class="text-base font-bold tracking-wide text-gray-900 uppercase">LAMINATE CHECKING REPORT</h1>
      </div>

      <!-- Page Indicator -->
      <div class="w-20 self-center text-right text-[9px] font-semibold text-gray-700">
        Page:
        <span class="text-xs font-bold text-gray-900">{{ pageData.page_number }}</span>
        / {{ pageData.total_pages }}
      </div>
    </div>

    <!-- ── Metadata Row ─────────────────────────────────────────────────── -->
    <div class="mb-3 grid grid-cols-14 items-center gap-x-4 text-[9px] font-medium text-nowrap">
      <div class="col-span-2 flex">
        <div class="flex items-center gap-1">
          <span class="font-bold">FG Code:</span>
          <span>{{ itemFg || "-" }}</span>
        </div>
      </div>
      <div class="col-span-5 flex items-center gap-1">
        <span class="font-bold">ชื่องาน:</span>
        <span class="line-clamp-1 text-wrap">{{ itemFgName || "-" }}</span>
      </div>
      <div class="col-span-2 flex items-center gap-1">
        <span class="font-bold">เครื่องเคลือบ:</span>
        <span>{{ machine }}</span>
      </div>
      <div class="col-span-2 flex">
        <div v-if="solventTypeName" class="flex items-center gap-1">
          <span class="font-bold">กระบวนการ:</span>
          <span>{{ solventTypeName }}</span>
        </div>
      </div>
      <div class="col-span-3 flex items-center justify-end gap-1">
        <span class="font-bold">วันที่:</span>
        <span> {{ formatDate(dateFrom) }}</span>
        <span> {{ formatTime(timeFrom) }}</span>
        <span class="self-center font-bold">ถึง</span>
        <span v-if="dateFrom !== dateTo">{{ formatDate(dateTo) }}</span>
        <span> {{ formatTime(timeTo) }}</span>
      </div>
    </div>

    <!-- ── Parameter Table (fills remaining height) ─────────────────────── -->
    <div class="flex-1">
      <Laminate_ParameterTable :time-columns="pageData.time_columns" :rows="pageData.rows" />
    </div>

    <!-- ── Footer ──────────────────────────────────────────────────────── -->
    <div class="pt-4 text-[9px]">
      <!-- Signatures Block -->
      <div class="flex items-center">
        <!-- Reviewer -->
        <div class="ml-auto flex w-40 flex-col gap-3">
          <div class="flex items-center gap-2">
            <span class="text-nowrap">ผู้ทบทวน:</span>
            <span class="block h-4 w-full border-b border-gray-400"></span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-nowrap">วันที่:</span>
            <span class="block h-4 w-full border-b border-gray-400 text-center"> </span>
          </div>
        </div>
      </div>

      <!-- Paper version -->
      <div>
        <span>FM-PRD-01/55 Rev.05 Effective Date : 01/01/2077</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import Laminate_ParameterTable from "./Laminate_ParameterTable.vue"

function formatDate(dateStr) {
  if (!dateStr) return ""
  const d = new Date(dateStr)
  if (isNaN(d)) return dateStr
  const day = String(d.getDate()).padStart(2, "0")
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
}

function formatTime(timeStr) {
  return timeStr + " น."
}

const props = defineProps({
  pageData: {
    type: Object,
    required: true,
  },
  machine: {
    type: String,
    default: "1LB09_Bobst",
  },
  itemFg: {
    type: String,
    default: "",
  },
  itemFgName: {
    type: String,
    default: "",
  },
  solventTypeName: {
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
})
</script>

<style lang="css" scoped>
.starflexLogo {
  background-image: url("@/assets/sheet_starflexLogo.png");
  background-size: auto 64px;
  background-repeat: no-repeat;
}
</style>
