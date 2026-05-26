<script setup lang="ts">
defineProps<{
  title: string
  detail?: string
}>()
</script>

<template>
  <div class="surface rounded-lg p-8 text-center">
    <p class="text-base font-semibold text-slate-100">{{ title }}</p>
    <p v-if="detail" class="mt-2 text-sm text-slate-400">{{ detail }}</p>
  </div>
</template>
