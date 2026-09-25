<template>
  <header class="no-print mb-6 flex flex-nowrap items-center justify-between gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
    <div class="flex items-center gap-3">
      <div class="icon-img flex h-10 w-10 flex-none rounded-lg bg-sky-100 font-bold text-white shadow" role="img" aria-label="โลโก้ Starflex"></div>
      <div>
        <div class="flex items-center gap-2">
          <h1 class="line-clamp-2 text-base leading-5 font-bold text-gray-900 sm:leading-normal md:text-lg">
            {{ currentProcess.title }}
          </h1>
        </div>
        <p class="hidden text-xs text-gray-600 md:inline-block">
          {{ currentProcess.subtitle }}
        </p>
      </div>
    </div>

    <!-- Right Controls: Process Type Dropdown & Setting -->
    <div class="ml-auto flex items-center">
      <!-- Process Type Dropdown -->
      <div class="relative" ref="dropdownRef">
        <button
          type="button"
          @click="isDropdownOpen = !isDropdownOpen"
          aria-haspopup="true"
          :aria-expanded="isDropdownOpen"
          aria-label="เลือกกระบวนการผลิต"
          class="inline-flex items-center gap-2.5 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-700 transition hover:border-gray-400 hover:bg-gray-100 focus:ring-2 focus:ring-sky-500 focus:outline-none sm:text-sm"
        >
          <!-- Active Process Icon -->
          <div class="flex h-6 w-6 items-center justify-center rounded p-4 text-white" :class="currentProcess.bgIconClass">
            <div v-if="currentProcess.id === 'laminate'">
              <Icon_process_laminate />
            </div>
            <div v-else-if="currentProcess.id === 'printing'">
              <Icon_process_printing />
            </div>
            <div v-else>
              <Icon_process_blowfilm />
            </div>
          </div>

          <span class="font-bold text-gray-900">{{ currentProcess.name }}</span>
          <span
            v-if="currentProcessStats.text"
            class="hidden items-center rounded border px-1.5 py-0.5 text-[11px] font-bold select-none sm:inline-block"
            :class="currentProcess.badgeClass"
          >
            {{ currentProcessStats.text }}
          </span>
          <!-- <span class="text-xs text-gray-500 hidden sm:inline">({{ currentProcess.nameTh }})</span> -->

          <svg
            class="h-4 w-4 text-gray-500 transition-transform duration-200"
            :class="{ 'rotate-180': isDropdownOpen }"
            aria-hidden="true"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <!-- Dropdown Menu -->
        <transition
          enter-active-class="transition duration-150 ease-out"
          enter-from-class="opacity-0 scale-95"
          enter-to-class="opacity-100 scale-100"
          leave-active-class="transition duration-100 ease-in"
          leave-from-class="opacity-100 scale-100"
          leave-to-class="opacity-0 scale-95"
        >
          <div
            v-if="isDropdownOpen"
            role="menu"
            aria-label="เลือกกระบวนการผลิต"
            class="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 text-sm shadow-xl"
          >
            <div class="border-b border-gray-100 bg-gray-50 px-3.5 py-2 text-[11px] font-bold tracking-wider text-gray-600">เลือกกระบวนการ (Process Type)</div>
            <div class="space-y-0.5 p-1">
              <button
                v-for="proc in processes"
                :key="proc.id"
                type="button"
                role="menuitem"
                @click="switchProcess(proc)"
                class="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition"
                :class="proc.route === route.path ? 'bg-sky-50 font-semibold text-sky-900' : 'text-gray-700 hover:bg-gray-100'"
              >
                <div class="flex items-center gap-3">
                  <div class="flex h-8 w-8 items-center justify-center rounded-lg text-white" :class="proc.bgIconClass">
                    <div v-if="proc.id === 'laminate'">
                      <Icon_process_laminate />
                    </div>
                    <div v-else-if="proc.id === 'printing'">
                      <Icon_process_printing />
                    </div>
                    <div v-else>
                      <Icon_process_blowfilm />
                    </div>
                  </div>
                  <div>
                    <div class="flex items-center gap-1.5">
                      <span class="text-sm leading-tight font-medium">{{ proc.name }}</span>
                      <span
                        v-if="getNumberOfIsMES(proc.processType).text"
                        class="py-0.2 rounded border px-1.5 text-[10px] font-bold select-none"
                        :class="proc.badgeClass"
                      >
                        {{ getNumberOfIsMES(proc.processType).text }}
                      </span>
                    </div>
                    <div class="text-xs text-gray-500">{{ proc.nameTh }}</div>
                  </div>
                </div>
                <span v-if="proc.route === route.path" class="text-sm font-bold text-sky-600">✓ </span>
              </button>
            </div>
          </div>
        </transition>
      </div>

      <!-- <router-link
        to="/setting"
        class="text-gray-400 hover:text-gray-600 text-xs px-1 w-0.5"
        title="การตั้งค่า"
      >
      </router-link> -->
    </div>
  </header>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue"
import { useRouter, useRoute } from "vue-router"
import Icon_process_blowfilm from "../components/icons/Icon_process_blowfilm.vue"
import Icon_process_printing from "../components/icons/Icon_process_printing.vue"
import Icon_process_laminate from "../components/icons/Icon_process_laminate.vue"

const router = useRouter()
const route = useRoute()

const isDropdownOpen = ref(false)
const dropdownRef = ref(null)

const processes = [
  {
    id: "printing",
    processType: "Printing",
    name: "Printing",
    nameTh: "เครื่องพิมพ์",
    route: "/printing",
    title: "Printing Checking Report System",
    subtitle: "ระบบดึงข้อมูลจาก SQL Server และออกรายงานตรวจบันทึกเครื่องพิมพ์",
    badgeClass: "bg-purple-100 text-purple-800 border border-purple-200",
    bgIconClass: "bg-purple-600",
  },
  {
    id: "laminate",
    processType: "Laminate",
    name: "Laminate",
    nameTh: "เครื่องเคลือบ",
    route: "/laminate",
    title: "Laminate Checking Report System",
    subtitle: "ระบบดึงข้อมูลจาก SQL Server และออกรายงานตรวจบันทึกเครื่องเคลือบ",
    badgeClass: "bg-sky-100 text-sky-800 border border-sky-200",
    bgIconClass: "bg-sky-600",
  },

  {
    id: "blownfilm",
    processType: "BlownFilm",
    name: "BlownFilm",
    nameTh: "เครื่องเป่าฟิล์ม",
    route: "/blownfilm",
    title: "Blown Film Checking Report System",
    subtitle: "ระบบดึงข้อมูลจาก SQL Server และออกรายงานตรวจบันทึกเครื่องเป่าฟิล์ม",
    badgeClass: "bg-emerald-100 text-emerald-800 border border-emerald-200",
    bgIconClass: "bg-emerald-600",
  },
]

const currentProcess = computed(() => {
  const found = processes.find((p) => p.route === route.path)
  return found || processes[0]
})

const switchProcess = (proc) => {
  isDropdownOpen.value = false
  if (route.path !== proc.route) {
    router.push(proc.route)
  }
}

const props = defineProps({
  machines: {
    type: Array,
    default: () => [],
  },
})

const BACKEND_API_BASE_URL = import.meta.env.VITE_BACK_BASE_URL || ""
const allMachines = ref([])

const fetchAllMachines = async () => {
  try {
    const res = await fetch(`${BACKEND_API_BASE_URL}/api/machines`)
    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data)) {
        allMachines.value = data
      }
    }
  } catch (err) {
    console.warn("Could not fetch machines list in AppHeadTitle:", err)
  }
}

const getNumberOfIsMES = (processType) => {
  const matchType = (processType || "").toLowerCase()
  let list = allMachines.value.filter((m) => (m.processType || "").toLowerCase() === matchType)

  if (list.length === 0 && (currentProcess.value.processType || "").toLowerCase() === matchType) {
    list = props.machines || []
  }

  const total = list.length
  const mes = list.filter((m) => m.isMES === true || m.isMES === "true" || m.isMES === 1).length
  return {
    mes,
    total,
    text: total > 0 ? `${mes}/${total}` : "",
  }
}

const currentProcessStats = computed(() => {
  return getNumberOfIsMES(currentProcess.value.processType)
})

const handleClickOutside = (event) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target)) {
    isDropdownOpen.value = false
  }
}

onMounted(() => {
  fetchAllMachines()
  window.addEventListener("click", handleClickOutside)
})

onUnmounted(() => {
  window.removeEventListener("click", handleClickOutside)
})
</script>

<style lang="css" scoped>
.icon-img {
  background-image: url("@/assets/icon_starflex_NoBG.svg");
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
}
</style>
