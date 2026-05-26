<script setup lang="ts">
defineProps<{
  label: string
  error?: string | null
}>()
</script>

<template>
  <label class="block">
    <span class="label">{{ label }}</span>
    <span class="mt-2 block">
      <slot />
    </span>
    <span v-if="error" class="mt-1 block text-xs text-danger">{{ error }}</span>
  </label>
</template>
