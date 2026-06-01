<script setup lang="ts">
defineProps<{
  columns: string[]
  minWidth?: string
}>()
</script>

<template>
  <div class="surface max-w-full overflow-hidden rounded-xl">
    <div class="max-w-full overflow-x-auto">
      <table class="responsive-table w-full divide-y divide-line" :style="{ minWidth: minWidth ?? '720px' }">
        <thead class="bg-white/[0.045]">
          <tr>
            <th v-for="column in columns" :key="column" class="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
              {{ column }}
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-line">
          <slot />
        </tbody>
      </table>
    </div>
  </div>
</template>
