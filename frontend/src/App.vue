<template>
  <div class="min-h-screen py-6 px-4">
    <div class="mx-auto" style="max-width: 297mm">
      <!-- App Header Title (Hidden on Print) -->
      <AppHeadTitle />

      <!-- Filter Controls Bar -->
      <FilterBar
        :filters="filters"
        :machines="machines"
        :statusLoading="isLoading"
        @search="fetchReport"
        @print="printReport"
      />

      <!-- Loading State Overlay -->
      <div
        v-if="isLoading"
        class="no-print flex flex-col items-center justify-center py-20 bg-white rounded-lg shadow border border-gray-200"
      >
        <Icon_circleLoad :cus-class="'h-10 w-10 text-sky-600 mb-3'" />
        <p class="text-sm font-semibold text-gray-700">
          กำลังดึงข้อมูลรายงานจากระบบ...
        </p>
        <p class="text-xs text-gray-500 mt-1">กรุณารอสักครู่</p>
      </div>

      <!-- Error Alert State -->
      <div
        v-else-if="errorMessage"
        class="no-print p-4 mb-6 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center justify-between"
      >
        <div class="flex items-center gap-2">
          <svg
            class="w-5 h-5 text-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            ></path>
          </svg>
          <span>{{ errorMessage }}</span>
        </div>
        <button
          @click="fetchReport"
          class="px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
        >
          ลองใหม่
        </button>
      </div>

      <!-- Report Pages Rendering Container -->
      <div
        class="overflow-auto"
        v-else-if="
          reportData && reportData.pages && reportData.pages.length > 0
        "
      >
        <div v-for="page in reportData.pages" :key="page.page_number">
          <LaminateReportSheet
            v-bind:page-data="page"
            :machine="reportData.machine"
            :date-from="reportData.date_from"
            :date-to="reportData.date_to"
            :time-from="reportData.time_from"
            :time-to="reportData.time_to"
          />
        </div>
      </div>

      <!-- No Data State -->
      <div
        v-else
        class="no-print py-16 text-center bg-white rounded-lg border border-gray-200 shadow-sm"
      >
        <svg
          class="mx-auto h-12 w-12 text-gray-400 mb-3"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          ></path>
        </svg>
        <h3 class="text-sm font-semibold text-gray-800">
          <div v-if="loadFristTime">
            กดปุ่ม "ดึงข้อมูล" เพื่อเริ่มสร้างรายงานใหม่
          </div>
          <div v-else>ไม่พบข้อมูลรายงานในช่วงเวลาดังกล่าว</div>
        </h3>
        <p v-if="!loadFristTime" class="text-xs text-gray-500 mt-1">
          กดปุ่ม "ดึงข้อมูล" เพื่อเริ่มค้นหารายงานใหม่
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from "vue";
import FilterBar from "./components/FilterBar.vue";
import LaminateReportSheet from "./components/LaminateReportSheet.vue";
import AppHeadTitle from "./components/AppHeadTitle.vue";
import Icon_circleLoad from "./components/icon/Icon_circleLoad.vue";

// Helpers for default date formatting (YYYY-MM-DD)
const loadFristTime = true;
const getTodayStr = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const filters = reactive({
  machine: "1LB09_Bobst",
  date_from: getTodayStr(),
  date_to: getTodayStr(),
  time_from: "08:00",
  time_to: "17:00",
  hour_step: 1,
});

const machines = ref([{ id: "1LB09_Bobst", name: "1LB09_Bobst" }]);

const isLoading = ref(false);
const errorMessage = ref("");
const reportData = ref(null);

const fetchMachines = async () => {
  try {
    const res = await fetch("/api/machines");
    if (res.ok) {
      const data = await res.json();
      if (data && data.length > 0) {
        machines.value = data;
      }
    }
  } catch (err) {
    console.warn("Could not fetch machines list, using defaults:", err);
  }
};

const fetchReport = async () => {
  isLoading.value = true;
  errorMessage.value = "";

  try {
    const queryParams = new URLSearchParams({
      machine: filters.machine,
      date_from: filters.date_from,
      date_to: filters.date_to,
      time_from: filters.time_from,
      time_to: filters.time_to,
      hour_step: filters.hour_step.toString(),
    });

    const res = await fetch(`/api/report/laminate?${queryParams.toString()}`);

    if (!res.ok) {
      throw new Error(`Server returned status ${res.status}`);
    }

    const data = await res.json();
    reportData.value = data;
  } catch (err) {
    console.error("Fetch report error:", err);
    errorMessage.value = `เกิดข้อผิดพลาดในการดึงข้อมูล: ${err.message}`;
  } finally {
    isLoading.value = false;
  }
};

const printReport = () => {
  window.print();
};

onMounted(() => {
  fetchMachines();
  // fetchReport();
});
</script>
