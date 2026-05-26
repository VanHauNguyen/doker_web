<script setup lang="ts">
defineProps<{
  title?: string
}>()
</script>

<template>
  <div class="surface rounded-xl p-4">
    <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <p v-if="title" class="text-sm font-bold text-ink">{{ title }}</p>
      <div class="grid flex-1 gap-3 sm:grid-cols-2 lg:flex lg:justify-end">
        <slot />
      </div>
    </div>
  </div>
</template>
