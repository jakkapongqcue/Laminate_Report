<template>
  <div class="mx-auto space-y-4" style="max-width: 297mm">
    <div class="flex items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold text-slate-800">Settings</h1>
      </div>
      <router-link
        to="/"
        class="inline-flex items-center px-3 py-2 text-sm font-medium bg-white border rounded-md shadow-sm text-slate-700 border-slate-200 hover:bg-slate-50"
      >
        Back to Home
      </router-link>
    </div>

    <div class="p-6 bg-white border shadow-sm border-slate-200 rounded-xl">
      <div class="space-y-4">
        <div class="flex items-center justify-between gap-4 p-4 border rounded-lg border-emerald-100 bg-emerald-50/50">
          <div class="flex items-center gap-3">
            <div class="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 font-bold">
              ✓
            </div>
            <div>
              <h2 class="text-sm font-semibold text-slate-800">Production Mode (Real Database)</h2>
              <p class="text-xs text-slate-500">ระบบเชื่อมต่อดึงข้อมูลจาก SQL Server KEP_LOG และ AXDB โดยตรง (ลบโหมด Test API ออกแล้ว)</p>
            </div>
          </div>
          <span class="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-100 rounded-full border border-emerald-200">
            Active
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
</script>
