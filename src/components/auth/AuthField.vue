<script setup lang="ts">
import { computed, ref, type Component } from 'vue'
import { Eye, EyeOff } from 'lucide-vue-next'

const props = withDefaults(defineProps<{
  modelValue: string
  label: string
  type?: string
  autocomplete?: string
  icon?: Component
  error?: string | null
  required?: boolean
}>(), {
  type: 'text',
  autocomplete: undefined,
  icon: undefined,
  error: null,
  required: false,
})

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
const visible = ref(false)
const inputType = computed(() => props.type === 'password' && visible.value ? 'text' : props.type)
</script>

<template>
  <label class="group block">
    <span class="mb-2 flex items-center justify-between text-xs font-black text-slate-300">
      {{ label }}
      <span v-if="required" class="text-amber-100">必填</span>
    </span>
    <span class="relative block">
      <component :is="icon" v-if="icon" class="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 transition group-focus-within:text-accent" />
      <input
        class="field h-12 w-full rounded-2xl border-white/10 bg-slate-950/35 transition focus:border-amber-200/35 focus:ring-2 focus:ring-amber-200/10"
        :class="[icon ? 'pl-11' : '', type === 'password' ? 'pr-11' : '', error ? 'border-rose-300/40 bg-rose-300/10' : '']"
        :type="inputType"
        :autocomplete="autocomplete"
        :required="required"
        :value="modelValue"
        @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      />
      <button v-if="type === 'password'" class="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 transition hover:text-white" type="button" @click="visible = !visible">
        <EyeOff v-if="visible" class="h-4 w-4" />
        <Eye v-else class="h-4 w-4" />
      </button>
    </span>
    <span v-if="error" class="mt-2 block text-xs font-semibold text-rose-200">{{ error }}</span>
  </label>
</template>
