<script setup lang="ts">
import { ref } from 'vue'
import { Upload } from 'lucide-vue-next'
import { uploadApi } from '@/api'

const emit = defineEmits<{
  uploaded: [url: string]
}>()

const loading = ref(false)
const error = ref<string | null>(null)

const onChange = async (event: Event): Promise<void> => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  loading.value = true
  error.value = null
  try {
    const result = await uploadApi.single(file)
    emit('uploaded', result.url)
  } catch (err) {
    error.value = err instanceof Error ? err.message : '上傳失敗'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="inline-flex flex-col gap-2">
    <label class="btn-secondary cursor-pointer">
      <Upload class="h-4 w-4" />
      {{ loading ? '上傳中' : '上傳圖片' }}
      <input class="hidden" type="file" accept="image/*" :disabled="loading" @change="onChange" />
    </label>
    <p v-if="error" class="text-xs text-danger">{{ error }}</p>
  </div>
</template>
