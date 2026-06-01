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
import { externalLinks } from '@/config/externalLinks'
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
        <a class="btn-secondary" :href="externalLinks.shopee.href" target="_blank" rel="noreferrer">前往蝦皮下單</a>
      </template>
    </PageHeader>
    <div class="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,.85fr)]">
      <section v-reveal class="surface overflow-hidden rounded-lg">
        <img :src="selectedVariant?.imageUrl ?? product.images?.[0]?.url ?? '/placeholder-product.svg'" :alt="product.name" class="h-72 w-full object-cover sm:h-[420px]" />
      </section>
      <section v-reveal class="surface min-w-0 space-y-5 rounded-lg p-4 sm:p-5">
        <div>
          <p class="label">價格</p>
          <p class="mt-1 break-words text-3xl font-bold text-accent">{{ money(selectedVariant?.priceOverride ?? product.price) }}</p>
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
            <span class="block break-words font-semibold text-white">{{ Object.values(variant.options).join(' / ') || variant.sku }}</span>
            <span class="mt-1 block text-slate-400">{{ money(variant.priceOverride ?? product.price) }}</span>
          </button>
        </div>
        <div v-if="selectedVariant?.warrantyEligible" class="rounded-md border border-mint/30 bg-mint/10 p-3 text-sm text-emerald-100">
          可建立保固 · {{ statusLabel(selectedVariant.warrantyType) }} {{ selectedVariant.warrantyDurationValue }} {{ selectedVariant.warrantyDurationUnit }}
        </div>
        <div class="rounded-xl border border-orange-300/20 bg-orange-400/10 p-4">
          <p class="font-bold text-slate-100">官方蝦皮商城</p>
          <p class="mt-1 text-sm leading-6 text-slate-400">若偏好蝦皮平台結帳、物流或活動優惠，也可以前往官方購物平台查看。</p>
          <a class="btn-secondary mt-3" :href="externalLinks.shopee.href" target="_blank" rel="noreferrer">前往蝦皮下單</a>
        </div>
      </section>
    </div>
    <SectionCard v-reveal title="商品評價" :subtitle="`${reviewSummary?.total ?? product.reviewCount ?? 0} 則評價 · 平均 ${product.averageRating ?? 0}`">
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
