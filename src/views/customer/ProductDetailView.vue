<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { productsApi } from '@/api'
import { useAuthStore } from '@/stores/auth'
import { useCartStore } from '@/stores/cart'
import PageHeader from '@/components/PageHeader.vue'
import LoadingState from '@/components/LoadingState.vue'
import SectionCard from '@/components/SectionCard.vue'
import { money } from '@/utils/format'
import { statusLabel } from '@/utils/status'
import type { ApiRecord, Product, ProductReview, ProductVariant } from '@/types/backend'

const route = useRoute()
const cart = useCartStore()
const auth = useAuthStore()
const product = ref<Product | null>(null)
const selectedVariant = ref<ProductVariant | null>(null)
const reviews = ref<ProductReview[]>([])
const reviewSummary = ref<ApiRecord | null>(null)
const loading = ref(true)

onMounted(async () => {
  const id = String(route.params.id)
  product.value = await productsApi.detail(id)
  const reviewPayload = await productsApi.reviews(id, { limit: 5 })
  reviews.value = Array.isArray(reviewPayload) ? reviewPayload as ProductReview[] : ((reviewPayload.data as ProductReview[] | undefined) ?? [])
  reviewSummary.value = Array.isArray(reviewPayload) ? null : reviewPayload
  selectedVariant.value = product.value.variants?.[0] ?? null
  loading.value = false
})
</script>

<template>
  <LoadingState v-if="loading" />
  <div v-else-if="product" class="space-y-6">
    <PageHeader :title="product.name" :description="product.description ?? undefined">
      <template #actions>
        <button v-if="auth.isAuthenticated && !auth.isAdmin" class="btn-primary" @click="cart.add(product.id, selectedVariant?.id)">加入購物車</button>
        <RouterLink v-else-if="!auth.isAuthenticated" class="btn-secondary" to="/auth/login">登入購買</RouterLink>
      </template>
    </PageHeader>
    <div class="grid gap-6 lg:grid-cols-[1.15fr_.85fr]">
      <section class="surface overflow-hidden rounded-lg">
        <img :src="selectedVariant?.imageUrl ?? product.images?.[0]?.url ?? '/placeholder-product.svg'" :alt="product.name" class="h-[420px] w-full object-cover" />
      </section>
      <section class="surface space-y-5 rounded-lg p-5">
        <div>
          <p class="label">價格</p>
          <p class="mt-1 text-3xl font-bold text-accent">{{ money(selectedVariant?.priceOverride ?? product.price) }}</p>
        </div>
        <div>
          <p class="label">庫存</p>
          <p class="mt-1 text-sm text-slate-300">{{ selectedVariant?.stock ?? product.stock }}</p>
        </div>
        <div v-if="product.variants?.length" class="space-y-2">
          <p class="label">商品規格</p>
          <button
            v-for="variant in product.variants"
            :key="variant.id"
            class="w-full rounded-md border border-line p-3 text-left text-sm hover:bg-white/[0.05]"
            :class="{ 'border-accent bg-accent/10': selectedVariant?.id === variant.id }"
            @click="selectedVariant = variant"
          >
            <span class="font-semibold text-white">{{ Object.values(variant.options).join(' / ') || variant.sku }}</span>
            <span class="ml-2 text-slate-400">{{ money(variant.priceOverride ?? product.price) }}</span>
          </button>
        </div>
        <div v-if="selectedVariant?.warrantyEligible" class="rounded-md border border-mint/30 bg-mint/10 p-3 text-sm text-emerald-100">
          可建立保固 · {{ statusLabel(selectedVariant.warrantyType) }} {{ selectedVariant.warrantyDurationValue }} {{ selectedVariant.warrantyDurationUnit }}
        </div>
      </section>
    </div>
    <SectionCard title="商品評價" :subtitle="`${reviewSummary?.total ?? product.reviewCount ?? 0} 則評價 · 平均 ${product.averageRating ?? 0}`">
      <div v-if="!reviews.length" class="text-sm text-slate-400">目前尚無評價。</div>
      <div v-else class="grid gap-3 md:grid-cols-2">
        <article v-for="review in reviews" :key="review.id" class="rounded-md border border-line p-3">
          <p class="font-semibold text-white">{{ '★'.repeat(review.rating) }}</p>
          <p class="mt-2 text-sm text-slate-300">{{ review.comment ?? '沒有留下文字評論' }}</p>
          <p class="mt-2 text-xs text-slate-500">{{ review.user?.name ?? review.userId }}</p>
        </article>
      </div>
    </SectionCard>
  </div>
</template>
