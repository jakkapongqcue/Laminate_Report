<template>
  <div class="mx-auto space-y-4" style="max-width: 297mm">
    <div class="flex items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold text-slate-800">Settings</h1>
      </div>
      <router-link
        to="/"
        class="inline-flex items-center rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
      >
        Back to Home
      </router-link>
    </div>

    <div class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div class="space-y-4">
        <div class="flex items-center justify-between gap-4 rounded-lg border border-emerald-100 bg-emerald-50/50 p-4">
          <div class="flex items-center gap-3">
            <div class="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 font-bold text-emerald-600">✓</div>
            <div>
              <h2 class="text-sm font-semibold text-slate-800">Production Mode (Real Database)</h2>
              <p class="text-xs text-slate-500">ระบบเชื่อมต่อดึงข้อมูลจาก SQL Server KEP_LOG และ AXDB โดยตรง (ลบโหมด Test API ออกแล้ว)</p>
            </div>
          </div>
          <span class="rounded-full border border-emerald-200 bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700"> Active </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup></script>
