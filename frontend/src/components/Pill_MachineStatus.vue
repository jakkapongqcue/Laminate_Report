<template>
  <button class="absolute top-1/2 right-8 -translate-y-1/2" :title="machineStatus_time" @mouseover="machineStatus_refreshTime()" @click="focusMachineSelect()">
    <span
      class="inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-all select-none"
      :class="machineStatus_pillClass"
    >
      <span class="h-2 w-2 animate-pulse rounded-full" :class="machineStatus_lightClass"> </span>
      {{ machineStatus_text }}
    </span>
  </button>
</template>

<script setup>
import { computed, onMounted, ref } from "vue"
import { timeAgo } from "@/utils/timeAgo.js"

const props = defineProps({
  machineStatus: {
    type: Object,
    default: () => {
      return {
        status: "Loading", // 'N/A', 'Online', 'Offline'
        time: "",
      }
    },
  },
})

const emit = defineEmits(["fetchMachineStatus"])

const focusMachineSelect = () => {
  const Input_Machine = document.getElementById("Input_Machine")
  if (Input_Machine) {
    if (typeof Input_Machine.showPicker === "function") {
      Input_Machine.showPicker()
    }
    Input_Machine.focus()
  }
}

const machineStatus_time = ref("")
const machineStatus_refreshTime = () => {
  if (props.machineStatus.status == "Loading" || props.machineStatus.status == "N/A") machineStatus_time.value = ""
  else machineStatus_time.value = `Status: ${timeAgo(new Date(props.machineStatus.time))}`
}

const machineStatus_pillClass = computed(() => {
  switch (props.machineStatus.status) {
    case "Error":
      return "bg-red-400 text-white border-red-400 duration-300"
    case "Loading":
      return "!border-none text-gray-500 animate-pulse"
    case "Online":
      return "bg-emerald-50 text-emerald-700 border-emerald-200 duration-300"
    case "Offline":
      return "bg-red-200 text-red-950 border-red-300 duration-300"
    default:
      return "opacity-0 duration-1000"
  }
})

const machineStatus_lightClass = computed(() => {
  switch (props.machineStatus.status) {
    case "Error":
      return "bg-red-600"
    case "Loading":
      return ""
    case "Online":
      return "bg-emerald-500"
    case "Offline":
      return "bg-red-500"
    default:
      return ""
  }
})

const machineStatus_text = computed(() => {
  switch (props.machineStatus.status) {
    case "Error":
      return "Error"
    case "Loading":
      return "Status..."
    case "Online":
      return "Online"
    case "Offline":
      return "Offline"
    default:
      return "N/A"
  }
})

onMounted(() => {
  emit("fetchMachineStatus")

  setInterval(() => {
    emit("fetchMachineStatus")
  }, 300000) // 5 minutes (5 * 60 * 1000)
})
</script>
