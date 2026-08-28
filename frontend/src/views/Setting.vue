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
      <div class="space-y-5">
        <div class="flex items-center justify-between gap-4 p-4 border rounded-lg border-slate-200">
          <div>
            <h2 class="text-sm font-semibold text-slate-800">Use test API</h2>
            <p class="text-sm text-slate-500">Toggle mock data for testing the report flow.</p>
          </div>

          <button
            type="button"
            role="switch"
            :aria-checked="useTestApi"
            :class="[
              'relative inline-flex h-7 w-12 items-center rounded-full transition-colors',
              useTestApi ? 'bg-sky-600' : 'bg-slate-300',
            ]"
            @click="toggleUseTestApi"
          >
            <span
              :class="[
                'inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform',
                useTestApi ? 'translate-x-6' : 'translate-x-1',
              ]"
            />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const TEST_API_STORAGE_KEY = 'laminate-report-use-test-api'
const useTestApi = ref(false)

const loadUseTestApiSetting = () => {
  const savedValue = localStorage.getItem(TEST_API_STORAGE_KEY)
  useTestApi.value = savedValue === 'true'
}

const toggleUseTestApi = () => {
  useTestApi.value = !useTestApi.value
  localStorage.setItem(TEST_API_STORAGE_KEY, String(useTestApi.value))
}

onMounted(() => {
  loadUseTestApiSetting()
})
</script>
