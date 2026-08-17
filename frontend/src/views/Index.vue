<template>
  <div>
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
      class="flex flex-col items-center justify-center py-20 bg-white border border-gray-200 rounded-lg shadow no-print"
    >
      <Icon_circleLoad :cus-class="'h-10 w-10 text-sky-600 mb-3'" />
      <p class="text-sm font-semibold text-gray-700">
        กำลังดึงข้อมูลรายงานจากระบบ...
      </p>
      <p class="mt-1 text-xs text-gray-500">กรุณารอสักครู่</p>
    </div>

    <!-- Error Alert State -->
    <div
      v-else-if="errorMessage"
      class="flex items-center justify-between p-4 mb-6 text-sm text-red-700 border border-red-200 rounded-lg no-print bg-red-50"
    >
      <div class="flex items-center gap-2">
        <Icon_error />
        <span>{{ errorMessage }}</span>
      </div>
      <button
        @click="fetchReport"
        class="px-3 py-1 text-xs text-white bg-red-600 rounded hover:bg-red-700"
      >
        ลองใหม่
      </button>
    </div>

    <!-- Report Pages Rendering Container -->
    <div
      class="overflow-auto"
      v-else-if="reportData && reportData.pages && reportData.pages.length > 0"
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
      class="py-16 text-center bg-white border border-gray-200 rounded-lg shadow-sm no-print"
    >
      <Icon_report />
      <h3 class="text-sm font-semibold text-gray-800">
        <div v-if="loadFristTime">
          กดปุ่ม "ดึงข้อมูล" เพื่อเริ่มสร้างรายงานใหม่
        </div>
        <div v-else>ไม่พบข้อมูลรายงานในช่วงเวลาดังกล่าว</div>
      </h3>
      <p v-if="!loadFristTime" class="mt-1 text-xs text-gray-500">
        กดปุ่ม "ดึงข้อมูล" เพื่อเริ่มค้นหารายงานใหม่
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from "vue";
import FilterBar from "../components/FilterBar.vue";
import LaminateReportSheet from "../components/LaminateReportSheet.vue";
import AppHeadTitle from "../components/AppHeadTitle.vue";
import Icon_circleLoad from "../components/icon/Icon_circleLoad.vue";
import Icon_report from "../components/icon/Icon_report.vue";
import Icon_error from "../components/icon/Icon_Error.vue";

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
  use_test_api: false
});

const loadUseTestApiSetting = () => {
  const savedValue = localStorage.getItem("laminate-report-use-test-api");
  if (savedValue !== null) {
    filters.use_test_api = savedValue === "true";
  }
};

const machines = ref([]);
const loadFristTime = ref(true);
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
  loadFristTime.value = false;

  try {
    const queryParams = new URLSearchParams({
      machine: filters.machine,
      date_from: filters.date_from,
      date_to: filters.date_to,
      time_from: filters.time_from,
      time_to: filters.time_to,
      hour_step: filters.hour_step.toString()
    });

    const path = filters.use_test_api
      ? "/api/report/laminate/test"
      : "/api/report/laminate";
    const res = await fetch(`${path}?${queryParams.toString()}`);

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
  loadUseTestApiSetting();
  fetchMachines();
});
</script>
