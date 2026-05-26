<script setup lang="ts">
defineProps<{
  title?: string
  subtitle?: string
}>()
</script>

<template>
  <section class="surface rounded-xl p-5">
    <div v-if="title || $slots.actions" class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h2 v-if="title" class="text-lg font-bold text-slate-100">{{ title }}</h2>
        <p v-if="subtitle" class="mt-1 text-sm text-slate-400">{{ subtitle }}</p>
      </div>
      <div v-if="$slots.actions" class="flex flex-wrap gap-2">
        <slot name="actions" />
      </div>
    </div>
    <slot />
  </section>
</template>
