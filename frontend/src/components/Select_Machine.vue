<template>
  <div class="w-full" ref="containerRef">
    <!-- Trigger Button (Custom Selector) -->
    <button
      type="button"
      id="Input_Machine"
      ref="triggerBtnRef"
      @click="toggleDropdown"
      @keydown.down.prevent="openAndFocusFirst"
      @keydown.esc.prevent="closeDropdown"
      @click.ctrl.alt="$emit('refreshMachine')"
      class="class_Input flex w-full items-center justify-between gap-2 bg-white text-left transition-all"
      aria-haspopup="listbox"
      :aria-expanded="isOpen"
      aria-label="เลือกเครื่องจักร"
    >
      <div class="flex min-w-0 flex-1 items-center gap-2">
        <span class="truncate font-medium text-gray-800">
          {{ selectedMachine ? selectedMachine.name : "เลือกเครื่องจักร..." }}
        </span>

        <!-- Badges for currently selected machine -->
        <div v-if="selectedMachine" class="flex shrink-0 items-center gap-1.5">
          <!-- MES Badge (Show only when isMES === true) -->
          <span v-if="selectedMachine.isMES" class="inline-flex items-center rounded bg-blue-600 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-white shadow-xl">
            MES
          </span>

          <!-- Report Status Badge -->
          <span class="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium" :class="getStatusBadgeClass(selectedMachine.statusDesc)">
            <span class="mr-1 h-1.5 w-1.5 rounded-full" :class="getStatusDotClass(selectedMachine.statusDesc)"></span>
            {{ selectedMachine.statusDesc }}
          </span>
        </div>
      </div>

      <!-- Chevron Icon -->
      <svg
        class="h-4 w-4 shrink-0 text-gray-500 transition-transform duration-200"
        :class="{ 'rotate-180': isOpen }"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </button>

    <!-- Custom Dropdown Menu -->
    <transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="transform opacity-0 scale-95 -translate-y-1"
      enter-to-class="transform opacity-100 scale-100 translate-y-0"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="transform opacity-100 scale-100 translate-y-0"
      leave-to-class="transform opacity-0 scale-95 -translate-y-1"
    >
      <div
        v-if="isOpen"
        class="absolute top-full left-0 z-50 mt-1 max-h-72 w-full min-w-[280px] overflow-hidden rounded-lg border border-slate-200 bg-white text-xs shadow-xl sm:w-full"
      >
        <!-- Options List -->
        <ul role="listbox" aria-label="รายการเครื่องจักร" class="max-h-60 divide-y divide-slate-100 overflow-y-auto">
          <li
            v-for="m in machines"
            :key="m.id"
            role="option"
            :aria-selected="m.id === modelValue"
            :aria-disabled="m.isMES === false"
            @click="selectMachine(m)"
            class="flex items-center justify-between px-3 py-2.5 transition-colors select-none"
            :class="getItemClass(m)"
          >
            <!-- Machine Name & Subtitle -->
            <div class="flex flex-col gap-0.5">
              <div class="flex items-center gap-1.5">
                <span class="font-medium" :class="m.isMES === false ? 'text-gray-700' : 'text-gray-900'">
                  {{ m.name }}
                </span>
                <!-- Active checkmark indicator -->
                <svg v-if="m.id === modelValue" class="h-4 w-4 shrink-0 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>

            <!-- Right Badges -->
            <div class="flex shrink-0 items-center gap-1.5">
              <!-- MES Badge (SHOW ONLY WHEN isMES === true) -->
              <span v-if="m.isMES" class="inline-flex items-center rounded bg-blue-600 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-white shadow-xs">
                MES
              </span>

              <!-- Status Badge -->
              <span
                v-if="m.isMES"
                class="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium"
                :class="getStatusBadgeClass(m.statusDesc, m.isMES)"
              >
                <span class="mr-1 h-1.5 w-1.5 rounded-full" :class="getStatusDotClass(m.statusDesc, m.isMES)"></span>
                {{ m.statusDesc }}
              </span>
            </div>
          </li>
        </ul>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue"

const props = defineProps({
  modelValue: {
    type: String,
    required: true,
  },
  machines: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(["update:modelValue", "change", "refreshMachine"])

const isOpen = ref(false)
const containerRef = ref(null)
const triggerBtnRef = ref(null)

const selectedMachine = computed(() => {
  return props.machines.find((m) => m.id === props.modelValue) || null
})

const toggleDropdown = () => {
  isOpen.value = !isOpen.value
}

const closeDropdown = () => {
  isOpen.value = false
}

const openAndFocusFirst = () => {
  isOpen.value = true
}

const selectMachine = (machine) => {
  // If isMES is false, it cannot be clicked / selected
  if (machine.isMES === false) {
    return
  }
  emit("update:modelValue", machine.id)
  emit("change", machine.id)
  closeDropdown()
}

// Styling for list items based on isMES and active state
const getItemClass = (m) => {
  if (m.isMES === false) {
    // Disabled style: Gray background, cannot click, muted text
    return "bg-gray-100 cursor-not-allowed opacity-80"
  }
  if (m.id === props.modelValue) {
    // Currently active machine
    return "bg-sky-50 font-medium cursor-pointer hover:bg-sky-100"
  }
  // Normal available machine
  return "cursor-pointer hover:bg-sky-50"
}

// Status badge styling
const getStatusBadgeClass = (statusDesc) => {
  switch (statusDesc) {
    case "Ready":
      return "bg-emerald-50 text-emerald-700 border-emerald-300"
    case "In Progress":
      return "bg-sky-50 text-sky-700 border-sky-300"
    case "Under Construction":
      return "bg-amber-50 text-amber-700 border-amber-300"
    default:
      return ""
  }
}

const getStatusDotClass = (statusDesc) => {
  switch (statusDesc) {
    case "Ready":
      return "bg-emerald-500"
    case "In Progress":
      return "bg-sky-500"
    case "Under Construction":
      return "bg-amber-500"
    default:
      return ""
  }
}

// Click outside handler
const handleClickOutside = (event) => {
  if (containerRef.value && !containerRef.value.contains(event.target)) {
    closeDropdown()
  }
}

onMounted(() => {
  document.addEventListener("click", handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener("click", handleClickOutside)
})
</script>
