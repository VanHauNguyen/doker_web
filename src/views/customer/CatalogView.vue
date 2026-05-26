<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { categoriesApi, productsApi } from '@/api'
import { useAuthStore } from '@/stores/auth'
import { useCartStore } from '@/stores/cart'
import PremiumHero from '@/components/PremiumHero.vue'
import FilterBar from '@/components/FilterBar.vue'
import LoadingState from '@/components/LoadingState.vue'
import EmptyState from '@/components/EmptyState.vue'
import { money } from '@/utils/format'
import { externalLinks } from '@/config/externalLinks'
import type { Category, Product } from '@/types/backend'

const cart = useCartStore()
const auth = useAuthStore()
const products = ref<Product[]>([])
const categories = ref<Category[]>([])
const categoryId = ref('')
const keyword = ref('')
const loading = ref(false)

const load = async (): Promise<void> => {
  loading.value = true
  try {
    const payload = await productsApi.list({
      categoryId: categoryId.value || undefined,
      keyword: keyword.value || undefined,
      limit: 24,
    })
    products.value = payload.data
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  categories.value = await categoriesApi.list()
  await load()
})

watch([categoryId, keyword], () => {
  void load()
})
</script>

<template>
  <div class="space-y-6">
    <PremiumHero eyebrow="DOKER 商城" title="保固商品、安裝項目與車用升級配件。" description="使用後端商品、分類、規格、庫存與服務型商務資料，呈現真實可購買內容。">
      <template #actions>
        <a class="btn-secondary" :href="externalLinks.shopee.href" target="_blank" rel="noreferrer">前往蝦皮商城</a>
      </template>
    </PremiumHero>
    <FilterBar v-reveal title="商品篩選">
      <input v-model="keyword" class="field" placeholder="搜尋商品" />
      <select v-model="categoryId" class="field">
        <option value="">全部分類</option>
        <option v-for="category in categories" :key="category.id" :value="category.id">{{ category.name }}</option>
      </select>
    </FilterBar>
    <LoadingState v-if="loading" />
    <EmptyState v-else-if="!products.length" title="找不到商品" detail="請調整搜尋關鍵字或分類。" />
    <div v-else class="stagger-children grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <article v-for="product in products" :key="product.id" class="hover-lift surface group overflow-hidden rounded-xl transition hover:border-slate-300/25">
        <RouterLink :to="`/products/${product.id}`">
          <img :src="product.images?.[0]?.url ?? '/placeholder-product.svg'" :alt="product.name" class="h-44 w-full bg-slate-900 object-cover" />
        </RouterLink>
        <div class="space-y-3 p-4">
          <div>
            <p class="text-xs text-slate-500">{{ product.category?.name ?? product.sku }}</p>
            <h2 class="mt-1 font-bold text-white">{{ product.name }}</h2>
            <p class="mt-2 line-clamp-2 min-h-10 text-sm text-slate-400">{{ product.description }}</p>
          </div>
          <div class="flex items-center justify-between gap-3">
            <p class="font-bold text-accent">{{ money(product.price) }}</p>
            <div class="flex flex-wrap justify-end gap-2">
              <button v-if="auth.isAuthenticated && !auth.isAdmin" class="btn-primary" @click="cart.add(product.id)">加入購物車</button>
              <RouterLink v-else-if="!auth.isAuthenticated" class="btn-secondary" to="/auth/login">登入購買</RouterLink>
              <a class="btn-secondary" :href="externalLinks.shopee.href" target="_blank" rel="noreferrer">蝦皮下單</a>
            </div>
          </div>
        </div>
      </article>
    </div>
  </div>
</template>
