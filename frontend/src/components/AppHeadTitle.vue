<template>
  <div
    class="no-print mb-6 flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-gray-200"
  >
    <div class="flex items-center gap-3">
      <div
        class="w-10 h-10 bg-sky-600 rounded-lg flex items-center justify-center text-white font-bold shadow"
      >
        LR
      </div>
      <div>
        <h1 class="text-lg font-bold text-gray-900">
          Laminate Checking Report System
        </h1>
        <p class="text-xs text-gray-500">
          ระบบดึงข้อมูลจาก SQL Server และออกรายงานตรวจบันทึกเครื่องเคลือบ
        </p>
      </div>
    </div>
    <div class="flex items-center gap-2">
      <span
        class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200"
      >
        <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        System Ready
      </span>
    </div>
  </div>
</template>
<script setup></script>
