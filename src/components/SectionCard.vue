<script setup lang="ts">
defineProps<{
  title?: string
  subtitle?: string
}>()
</script>

<template>
  <section class="premium-panel min-w-0 rounded-2xl p-4 transition duration-300 hover:-translate-y-0.5 sm:p-5">
    <div v-if="title || $slots.actions" class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div class="min-w-0">
        <h2 v-if="title" class="break-words text-lg font-bold text-slate-100">{{ title }}</h2>
        <p v-if="subtitle" class="mt-1 break-words text-sm text-slate-400">{{ subtitle }}</p>
      </div>
      <div v-if="$slots.actions" class="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">
        <slot name="actions" />
      </div>
    </div>
    <slot />
  </section>
</template>
