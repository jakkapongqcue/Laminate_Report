<template>
  <div class="class_InputGroup relative col-span-2 flex flex-col">
    <label class="class_Lable">
      <Icon_finishGood />
      Item FG
    </label>
    <div class="relative flex items-center gap-x-2">
      <div class="flex-1" ref="itemFgContainerRef">
        <input
          id="Input_FG"
          ref="inputFgRef"
          type="search"
          @dblclick.ctrl="handleDblClickExample()"
          @input="handleItemFgInput()"
          @keyup.enter="handleEnterOrSearch()"
          v-model.trim="filters.item_fg"
          placeholder="ระบุ Item FG หรือคำค้นหา เช่น 180101 (กด Enter เพื่อค้นหา)"
          class="class_Input w-full font-mono uppercase placeholder:text-xs"
          :class="{ 'pr-45': itemFgStatus && itemFgStatus.show }"
          autocomplete="off"
        />

        <!-- Right action buttons / Pills inside Input -->
        <div class="absolute top-1/2 right-1 flex -translate-y-1/2 items-center gap-1.5">
          <!-- Search Icon Button (Click to trigger search) -->
          <button
            type="button"
            @click="handleEnterOrSearch()"
            :disabled="isCheckingItemFg"
            title="กดเพื่อค้นหา Item FG (หรือกดปุ่ม Enter)"
            class="hidden rounded bg-sky-50 p-2 text-gray-400 transition-colors hover:text-sky-600 focus:outline-none sm:inline-block"
          >
            <Icon_search :cusClass="'w-4 h-4'" />
          </button>

          <!-- Pill Notification Inside Input (Persistent until text changes) -->
          <transition
            enter-active-class="transition duration-200 ease-out"
            enter-from-class="opacity-0 scale-90"
            enter-to-class="opacity-100 scale-100"
            leave-active-class="transition duration-200 ease-in"
            leave-from-class="opacity-100 scale-100"
            leave-to-class="opacity-0 scale-90"
          >
            <div v-if="itemFgStatus && itemFgStatus.show" :title="itemFgStatus.message || ''" class="flex cursor-pointer items-center" @click="focusInputItemFG()">
              <span class="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition-all select-none" :class="itemFgPillClass">
                <Icon_checkUncheck :statusIcon="itemFgStatus.status" />
                <span>{{ itemFgStatus.text }}</span>
              </span>
            </div>
          </transition>
        </div>

        <!-- Search Dropdown Result (TOP 20) -->
        <div
          v-if="showDropdown && itemFgSearchResults && itemFgSearchResults.length > 0"
          class="absolute top-full right-0 left-0 z-50 mt-1 overflow-hidden rounded-lg border border-slate-300 bg-white text-xs shadow-xl"
        >
          <div class="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] text-gray-500">
            <span>
              พบ
              <strong class="font-semibold text-sky-600">
                {{ itemFgSearchResults.length }}
              </strong>
              รายการที่ตรงกับคำค้นหา:
            </span>
            <button type="button" @click="closeDropdown()" class="px-1 font-bold text-gray-400 hover:text-gray-600">✕</button>
          </div>
          <ul class="max-h-56 divide-y divide-slate-100 overflow-y-auto">
            <li
              v-for="item in itemFgSearchResults"
              :key="item.item_fg"
              @click="handleSelectSearchResult(item)"
              class="group flex cursor-pointer flex-col px-3 py-2 text-left transition-colors hover:bg-sky-50"
            >
              <div class="flex items-center justify-between">
                <span class="font-mono font-bold text-gray-800 group-hover:text-sky-600" v-html="highlightKeyword(item.item_fg, filters.item_fg)"></span>
              </div>
              <div v-if="item.item_fg_name" class="mt-0.5 truncate text-[11px] text-gray-500" :title="item.item_fg_name">
                {{ item.item_fg_name }}
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- ProdPool Section with Smooth Grid Transition -->
    <div
      class="grid transition-all duration-300 ease-in-out"
      :class="prodPools && prodPools.length > 0 ? 'mt-2 grid-rows-[1fr] opacity-100' : 'mt-0 grid-rows-[0fr] opacity-0'"
    >
      <div class="overflow-hidden">
        <transition
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="opacity-0 translate-y-1"
          enter-to-class="opacity-100 translate-y-0"
          leave-active-class="transition duration-150 ease-in"
          leave-from-class="opacity-100 translate-y-0"
          leave-to-class="opacity-0 -translate-y-1"
          mode="out-in"
        >
          <!-- ProdPool Standard Radio Selection (When multiple pools found for Item FG) -->
          <div
            v-if="prodPools && prodPools.length > 1"
            key="multiple"
            class="flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
          >
            <span class="font-semibold text-gray-700">รอบการเคลือบ:</span>
            <div class="flex flex-wrap items-center gap-x-4 gap-y-1.5">
              <label v-for="p in prodPools" :key="p.poolId" class="inline-flex cursor-pointer items-center gap-1.5 font-medium text-gray-700 hover:text-sky-700">
                <input
                  type="radio"
                  name="prodPoolSelect"
                  :value="p.poolId"
                  v-model="filters.prod_pool"
                  class="h-3.5 w-3.5 cursor-pointer border-gray-300 text-sky-600 focus:ring-sky-500"
                />
                <span>{{ p.name }}</span>
                <span v-if="p.revId" class="self-end font-mono text-[11px] leading-3 text-gray-400">(Rev.{{ p.revId }})</span>
              </label>
            </div>
          </div>

          <!-- Single Pool Info Indicator -->
          <div v-else-if="prodPools && prodPools.length === 1" key="single" class="flex items-center gap-1.5 text-xs text-gray-500">
            <span>รอบการเคลือบ:</span>
            <span class="font-semibold text-gray-800">{{ prodPools[0].name }}</span>
            <span v-if="prodPools[0].revId" class="font-mono text-gray-400">(Rev.{{ prodPools[0].revId }}) </span>
          </div>
        </transition>
      </div>
    </div>

    <!-- Product Name Info with Smooth Transition -->
    <transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 translate-y-1"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-1"
      mode="out-in"
      ><div v-if="filters.item_fg_name && filters.item_fg_name.length > 0" class="mt-2 flex items-center gap-1.5 text-xs text-gray-500">
        <span class="self-start text-nowrap">ชื่อสินค้า:</span>
        <span class="line-clamp-2 md:line-clamp-1" :title="filters.item_fg_name">{{ filters.item_fg_name }} </span>
      </div></transition
    >
  </div>
</template>

<script setup>
import { computed, ref, watch, onMounted, onUnmounted } from "vue"
import Icon_finishGood from "./icons/Icon_finishGood.vue"
import Icon_search from "./icons/Icon_search.vue"
import Icon_checkUncheck from "./icons/Icon_checkUncheck.vue"

const props = defineProps({
  filters: {
    type: Object,
    required: true,
  },
  isCheckingItemFg: {
    type: Boolean,
    default: false,
  },
  itemFgStatus: {
    type: Object,
    default: () => ({
      show: false,
      status: "idle",
      text: "",
      message: "",
    }),
  },
  prodPools: {
    type: Array,
    default: () => [],
  },
  itemFgSearchResults: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(["checkItemFGwithMachine", "searchItemFGwithMachine", "selectItemFgFromSearch", "clearItemFgSearchResults", "clearItemFgStatus"])

const inputFgRef = ref(null)
const itemFgContainerRef = ref(null)
const showDropdown = ref(false)

const itemFgPillClass = computed(() => {
  if (!props.itemFgStatus) return ""
  switch (props.itemFgStatus.status) {
    case "found":
      return "bg-emerald-50 text-emerald-700 border-emerald-300"
    case "not_found":
      return "bg-rose-50 text-rose-700 border-rose-300"
    case "checking":
      return "bg-sky-50 text-sky-700 border-sky-300"
    default:
      return "bg-gray-100 text-gray-700 border-gray-300"
  }
})

watch(
  () => props.itemFgSearchResults,
  (newVal) => {
    if (newVal && newVal.length > 0) {
      showDropdown.value = true
    } else {
      showDropdown.value = false
    }
  },
  { deep: true },
)

const handleClickOutside = (event) => {
  if (itemFgContainerRef.value && !itemFgContainerRef.value.contains(event.target)) {
    closeDropdown()
  }
}

const handleFocusItemFg = (event) => {
  if (itemFgContainerRef.value && itemFgContainerRef.value.contains(event.target)) {
    if (props.itemFgSearchResults && props.itemFgSearchResults.length > 0) {
      showDropdown.value = true
    }
  }
}

onMounted(() => {
  document.addEventListener("click", handleClickOutside)
  document.addEventListener("focusin", handleFocusItemFg)
})

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside)
  document.removeEventListener("focusin", handleFocusItemFg)
})

const closeDropdown = () => {
  showDropdown.value = false
}

const handleSelectSearchResult = (item) => {
  showDropdown.value = false
  emit("selectItemFgFromSearch", item)
}

const highlightKeyword = (text, query) => {
  if (!text) return ""
  const q = (query || "").trim()
  if (!q) return text
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const regex = new RegExp(`(${escaped})`, "gi")
  return text.replace(regex, '<span class="bg-yellow-200 text-yellow-900 font-bold px-0.5 rounded">$1</span>')
}

const handleDblClickExample = () => {
  props.filters.item_fg = "FGF0001020180101"
  emit("checkItemFGwithMachine")
}

const handleItemFgInput = () => {
  if (showDropdown.value) {
    showDropdown.value = false
    emit("clearItemFgSearchResults")
  }
  emit("clearItemFgStatus")
}

const handleEnterOrSearch = () => {
  closeDropdown()
  emit("searchItemFGwithMachine")
}

const focusInputItemFG = () => {
  if (inputFgRef.value) {
    inputFgRef.value.focus()
  } else {
    document.getElementById("Input_FG")?.focus()
  }
}
</script>

<style lang="css" scoped>
input[type="search"]::-webkit-search-decoration,
input[type="search"]::-webkit-search-cancel-button,
input[type="search"]::-webkit-search-results-button,
input[type="search"]::-webkit-search-results-decoration {
  display: none;
}
</style>
