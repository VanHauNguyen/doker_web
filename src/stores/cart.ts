import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { cartApi } from '@/api'
import type { Cart } from '@/types/backend'

export const useCartStore = defineStore('cart', () => {
  const cart = ref<Cart | null>(null)
  const loading = ref(false)

  const count = computed(() => cart.value?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0)
  const subtotal = computed(() => cart.value?.subtotal ?? cart.value?.total ?? 0)

  const refresh = async (): Promise<void> => {
    loading.value = true
    try {
      cart.value = await cartApi.get()
    } finally {
      loading.value = false
    }
  }

  const add = async (productId: string, productVariantId?: string): Promise<void> => {
    cart.value = await cartApi.add({ productId, productVariantId, quantity: 1 })
  }

  const update = async (id: string, quantity: number): Promise<void> => {
    cart.value = await cartApi.update(id, quantity)
  }

  const remove = async (id: string): Promise<void> => {
    cart.value = await cartApi.remove(id)
  }

  return { cart, loading, count, subtotal, refresh, add, update, remove }
})
