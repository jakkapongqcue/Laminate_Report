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
    <router-link
      to="/setting"
      class="inline-flex items-center px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-md border border-slate-200 hover:bg-slate-200 no-print"
    >
      Settings
    </router-link>
  </div>
</template>
