<script setup lang="ts">
import { computed } from 'vue'
import UploadButton from '@/components/UploadButton.vue'

const props = defineProps<{
  modelValue?: string | null
}>()

const emit = defineEmits<{
  'update:modelValue': [url: string]
}>()

const hasPreview = computed(() => Boolean(props.modelValue))
</script>

<template>
  <div class="space-y-3">
    <div v-if="hasPreview" class="overflow-hidden rounded-lg border border-line bg-white/70">
      <img :src="modelValue ?? ''" alt="圖片預覽" class="h-40 w-full object-cover" />
    </div>
    <UploadButton @uploaded="(url) => emit('update:modelValue', url)" />
  </div>
</template>
