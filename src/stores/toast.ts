import { ref } from 'vue'
import { defineStore } from 'pinia'

export type ToastTone = 'success' | 'error' | 'info'

export const useToastStore = defineStore('toast', () => {
  const messages = ref<Array<{ id: string; tone: ToastTone; text: string }>>([])

  const push = (text: string, tone: ToastTone = 'info'): void => {
    const id = crypto.randomUUID()
    messages.value.push({ id, tone, text })
    window.setTimeout(() => {
      messages.value = messages.value.filter((item) => item.id !== id)
    }, 3600)
  }

  return { messages, push }
})
