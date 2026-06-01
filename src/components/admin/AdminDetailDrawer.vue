<script setup lang="ts">
import { X } from 'lucide-vue-next'

defineProps<{
  open: boolean
  title: string
  subtitle?: string
}>()

const emit = defineEmits<{
  close: []
}>()
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="fixed inset-0 z-50">
      <button class="absolute inset-0 bg-black/55 backdrop-blur-sm" aria-label="關閉明細" @click="emit('close')" />
      <aside class="surface absolute right-0 top-0 h-full w-full max-w-2xl overflow-y-auto border-y-0 border-r-0 p-4 shadow-2xl sm:p-5">
        <header class="flex items-start justify-between gap-4 border-b border-line pb-4">
          <div class="min-w-0">
            <p class="label truncate">{{ subtitle }}</p>
            <h2 class="mt-1 break-words text-xl font-bold text-slate-100">{{ title }}</h2>
          </div>
          <button class="btn-secondary h-10 w-10 shrink-0 px-0" aria-label="關閉" @click="emit('close')">
            <X class="h-4 w-4" />
          </button>
        </header>
        <div class="py-5">
          <slot />
        </div>
      </aside>
    </div>
  </Teleport>
</template>
