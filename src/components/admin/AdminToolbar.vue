<script setup lang="ts">
defineProps<{
  title: string
  subtitle?: string
}>()
</script>

<template>
  <section class="surface min-w-0 rounded-lg p-4">
    <div class="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div class="min-w-0">
        <p class="label break-words">{{ title }}</p>
        <p v-if="subtitle" class="mt-1 break-words text-sm text-slate-400">{{ subtitle }}</p>
      </div>
      <div class="flex w-full flex-wrap items-center gap-3 lg:w-auto lg:justify-end">
        <slot />
      </div>
    </div>
  </section>
</template>
