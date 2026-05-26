<script setup lang="ts">
defineProps<{
  title: string
  subtitle?: string
}>()
</script>

<template>
  <section class="surface rounded-lg p-4">
    <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <p class="label">{{ title }}</p>
        <p v-if="subtitle" class="mt-1 text-sm text-slate-400">{{ subtitle }}</p>
      </div>
      <div class="flex flex-wrap items-center gap-3">
        <slot />
      </div>
    </div>
  </section>
</template>
