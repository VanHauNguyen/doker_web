<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { checkoutApi, couponsApi, paymentsApi, vehiclesApi } from '@/api'
import { useCartStore } from '@/stores/cart'
import EmptyState from '@/components/EmptyState.vue'
import SectionCard from '@/components/SectionCard.vue'
import PremiumHero from '@/components/PremiumHero.vue'
import { money } from '@/utils/format'
import { DELIVERY_METHOD_OPTIONS, PAYMENT_METHOD_OPTIONS, PAYMENT_METHODS_BY_DELIVERY } from '@/utils/orderFulfillment'
import { couponAvailability, couponDiscountText, normalizeCoupon, unwrapList } from '@/utils/membershipRewards'
import type { ApiRecord, Coupon, DeliveryMethod, OrderPaymentMethod, Vehicle } from '@/types/backend'

const cart = useCartStore()
const couponCode = ref('')
const deliveryMethod = ref<DeliveryMethod>('HOME_DELIVERY')
const paymentMethod = ref<OrderPaymentMethod>('ONLINE_PAYMENT')
const recipientName = ref('')
const recipientPhone = ref('')
const city = ref('')
const district = ref('')
const address = ref('')
const cvsStoreType = ref('7ELEVEN')
const cvsStoreId = ref('')
const cvsStoreName = ref('')
const cvsStoreAddress = ref('')
const selectedVehicleId = ref('')
const vehiclePlate = ref('')
const vehicleBrand = ref('')
const vehicleModel = ref('')
const preview = ref<ApiRecord | null>(null)
const coupons = ref<Coupon[]>([])
const vehicles = ref<Vehicle[]>([])
const message = ref<string | null>(null)
const error = ref<string | null>(null)
const couponLoading = ref(false)

const availablePaymentOptions = computed(() => {
  const allowed = PAYMENT_METHODS_BY_DELIVERY[deliveryMethod.value]
  return PAYMENT_METHOD_OPTIONS.filter((item) => allowed.includes(item.value))
})

const requiresVehicleInfo = computed(() => Boolean(preview.value?.requiresVehicleInfo))

const checkoutBody = computed<ApiRecord>(() => ({
  couponCode: couponCode.value || undefined,
  deliveryMethod: deliveryMethod.value,
  paymentMethod: paymentMethod.value,
  recipientName: recipientName.value,
  recipientPhone: recipientPhone.value,
  city: deliveryMethod.value === 'HOME_DELIVERY' ? city.value : undefined,
  district: deliveryMethod.value === 'HOME_DELIVERY' ? district.value : undefined,
  address: deliveryMethod.value === 'HOME_DELIVERY' ? address.value : undefined,
  cvsStoreType: deliveryMethod.value.startsWith('CVS') ? cvsStoreType.value : undefined,
  cvsStoreId: deliveryMethod.value.startsWith('CVS') ? cvsStoreId.value : undefined,
  cvsStoreName: deliveryMethod.value.startsWith('CVS') ? cvsStoreName.value : undefined,
  cvsStoreAddress: deliveryMethod.value.startsWith('CVS') ? cvsStoreAddress.value : undefined,
  vehicleId: selectedVehicleId.value || undefined,
  vehicleSnapshot: requiresVehicleInfo.value && !selectedVehicleId.value ? {
    plate: vehiclePlate.value,
    brand: vehicleBrand.value,
    model: vehicleModel.value,
  } : undefined,
}))

const runPreview = async (): Promise<void> => {
  error.value = null
  preview.value = await checkoutApi.preview(checkoutBody.value)
}

const createOrder = async (): Promise<void> => {
  error.value = null
  try {
    const result = await checkoutApi.createOrder(checkoutBody.value)
    const order = result.order as { id?: string } | undefined
    if (order?.id && paymentMethod.value === 'ONLINE_PAYMENT') {
      await paymentsApi.createSession({ orderId: order.id, provider: 'FAKE', method: 'ONLINE_PAYMENT' })
    }
    await cart.refresh()
    message.value = '訂單已建立'
  } catch (err) {
    error.value = err instanceof Error ? err.message : '結帳失敗'
  }
}

const applyCoupon = async (coupon: Coupon): Promise<void> => {
  couponCode.value = coupon.code ?? ''
  await runPreview()
}

watch(deliveryMethod, () => {
  if (!PAYMENT_METHODS_BY_DELIVERY[deliveryMethod.value].includes(paymentMethod.value)) {
    paymentMethod.value = PAYMENT_METHODS_BY_DELIVERY[deliveryMethod.value][0]
  }
})

onMounted(async () => {
  try {
    await cart.refresh()
    couponLoading.value = true
    const [couponPayload, vehiclePayload] = await Promise.all([couponsApi.mine(), vehiclesApi.list()])
    coupons.value = unwrapList<Coupon>(couponPayload).map(normalizeCoupon)
    vehicles.value = vehiclePayload
    selectedVehicleId.value = vehicles.value[0]?.id ?? ''
  } catch (err) {
    error.value = err instanceof Error ? err.message : '結帳資料載入失敗'
  } finally {
    couponLoading.value = false
  }
})
</script>

<template>
  <div class="space-y-6">
    <PremiumHero
      eyebrow="會員結帳"
      title="完成配送、付款、優惠券與安裝車輛資料。"
      description="依照行動 App 結帳規則：配送方式會限制付款方式，優惠券由後端驗證，安裝商品可綁定愛車資料。"
    />
    <EmptyState v-if="!cart.cart?.items.length" title="購物車目前是空的" detail="前往商城挑選商品或安裝服務。" />
    <div v-else class="grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
      <SectionCard title="購物車商品" subtitle="同步後端購物車快照、規格、數量與金額。">
        <div class="mt-4 divide-y divide-line">
          <div v-for="item in cart.cart.items" :key="item.id" class="grid gap-3 py-4 sm:grid-cols-[1fr_120px_80px] sm:items-center">
            <div>
              <p class="font-semibold text-white">{{ item.product.name }}</p>
              <p class="text-sm text-slate-400">{{ item.productVariant?.sku ?? item.product.sku }}</p>
            </div>
            <input class="field" type="number" min="1" :value="item.quantity" @change="cart.update(item.id, Number(($event.target as HTMLInputElement).value))" />
            <button class="btn-secondary" @click="cart.remove(item.id)">移除</button>
          </div>
        </div>
      </SectionCard>
      <form class="surface space-y-4 rounded-lg p-5" @submit.prevent="createOrder">
        <div>
          <p class="text-lg font-bold text-white">配送與付款</p>
          <p class="mt-1 text-sm text-slate-400">送出前可先試算，確認優惠券、運費、庫存與車輛資料需求。</p>
        </div>
        <select v-model="deliveryMethod" class="field">
          <option v-for="option in DELIVERY_METHOD_OPTIONS" :key="option.value" :value="option.value">{{ option.label }}</option>
        </select>
        <select v-model="paymentMethod" class="field">
          <option v-for="option in availablePaymentOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
        </select>
        <input v-model="recipientName" class="field" placeholder="收件人姓名" required />
        <input v-model="recipientPhone" class="field" placeholder="收件人手機" required />
        <template v-if="deliveryMethod === 'HOME_DELIVERY'">
          <input v-model="city" class="field" placeholder="縣市" required />
          <input v-model="district" class="field" placeholder="鄉鎮市區" required />
          <input v-model="address" class="field" placeholder="詳細地址" required />
        </template>
        <template v-if="deliveryMethod.startsWith('CVS')">
          <input v-model="cvsStoreType" class="field" placeholder="超商類型" required />
          <input v-model="cvsStoreId" class="field" placeholder="門市代碼" required />
          <input v-model="cvsStoreName" class="field" placeholder="門市名稱" required />
          <input v-model="cvsStoreAddress" class="field" placeholder="門市地址" />
        </template>
        <div v-if="requiresVehicleInfo || deliveryMethod === 'STORE_INSTALLATION'" class="space-y-3 rounded-md border border-line p-3">
          <p class="label">安裝車輛</p>
          <select v-if="vehicles.length" v-model="selectedVehicleId" class="field">
            <option value="">手動填寫車輛資料</option>
            <option v-for="vehicle in vehicles" :key="vehicle.id" :value="vehicle.id">{{ vehicle.plate }} · {{ vehicle.brand }} {{ vehicle.model }}</option>
          </select>
          <template v-if="!selectedVehicleId">
            <input v-model="vehiclePlate" class="field" placeholder="車牌" />
            <input v-model="vehicleBrand" class="field" placeholder="品牌" />
            <input v-model="vehicleModel" class="field" placeholder="車型" />
          </template>
        </div>
        <input v-model="couponCode" class="field" placeholder="優惠券代碼" />
        <div class="space-y-2">
          <p class="label">可用優惠券</p>
          <p v-if="couponLoading" class="rounded-xl border border-white/10 bg-white/[0.04] p-3 text-sm text-slate-400">優惠券載入中...</p>
          <p v-else-if="!coupons.length" class="rounded-xl border border-dashed border-white/15 p-3 text-sm text-slate-400">目前沒有可用優惠券。</p>
          <button
            v-for="coupon in coupons"
            :key="coupon.id"
            class="w-full rounded-2xl border p-3 text-left text-sm transition hover:bg-white/[0.05]"
            :class="couponAvailability(coupon, cart.subtotal, cart.cart?.items ?? []).canUse ? 'border-amber-200/25 bg-amber-300/10' : 'border-line opacity-60'"
            type="button"
            :disabled="!couponAvailability(coupon, cart.subtotal, cart.cart?.items ?? []).canUse"
            @click="applyCoupon(coupon)"
          >
            <span class="flex items-center justify-between gap-3">
              <span>
                <span class="block font-semibold text-white">{{ coupon.name }}</span>
                <span class="mt-1 block text-xs text-slate-400">{{ couponDiscountText(coupon) }} · {{ coupon.usageCondition ?? coupon.applicabilityLabel ?? '結帳時驗證' }}</span>
              </span>
              <span class="rounded-full border border-white/10 px-2 py-1 text-xs text-slate-300">{{ couponAvailability(coupon, cart.subtotal, cart.cart?.items ?? []).label }}</span>
            </span>
            <span v-if="couponAvailability(coupon, cart.subtotal, cart.cart?.items ?? []).reason" class="mt-2 block text-xs text-slate-500">
              {{ couponAvailability(coupon, cart.subtotal, cart.cart?.items ?? []).reason }}
            </span>
          </button>
        </div>
        <div class="rounded-xl border border-line bg-white/[0.05] p-4 text-sm text-slate-300">
          <p>商品小計：<strong class="text-white">{{ money(cart.subtotal) }}</strong></p>
          <p v-if="preview">試算總額：<strong class="text-accent">{{ money(preview.total) }}</strong></p>
          <p v-if="preview?.discountAmount">優惠折抵：<strong class="text-mint">{{ money(preview.discountAmount) }}</strong></p>
          <p v-if="preview?.shippingFee">運費：<strong class="text-white">{{ money(preview.shippingFee) }}</strong></p>
        </div>
        <p v-if="message" class="text-sm text-mint">{{ message }}</p>
        <p v-if="error" class="text-sm text-danger">{{ error }}</p>
        <div class="flex gap-2">
          <button class="btn-secondary flex-1" type="button" @click="runPreview">試算</button>
          <button class="btn-primary flex-1">建立訂單</button>
        </div>
      </form>
    </div>
  </div>
</template>
