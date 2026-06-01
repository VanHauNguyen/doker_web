<script setup lang="ts">
import DataTable from '@/components/DataTable.vue'

defineProps<{
  columns: string[]
}>()
</script>

<template>
  <DataTable :columns="columns" min-width="920px">
    <slot />
  </DataTable>
</template>
