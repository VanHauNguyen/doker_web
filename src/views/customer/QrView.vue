<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import QRCode from 'qrcode'
import { Copy, RefreshCw, Search } from 'lucide-vue-next'
import { qrApi, rewardsApi, warrantiesApi } from '@/api'
import PageHeader from '@/components/PageHeader.vue'
import PageState from '@/components/PageState.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import { useAuthStore } from '@/stores/auth'
import { dateTime } from '@/utils/format'
import { normalizeRedemption, unwrapList } from '@/utils/membershipRewards'
import type { ApiRecord, RewardRedemption, Warranty } from '@/types/backend'

interface QrPayload {
  type: string
  token?: string
  warrantyId?: string
  iat?: number
}

interface DisplayQr {
  title: string
  subtitle: string
  token: string
  rawPayload: string
  image: string | null
  expiresText?: string
}

const auth = useAuthStore()
const userQr = ref<DisplayQr | null>(null)
const warrantyQr = ref<DisplayQr | null>(null)
const rewardQrs = ref<DisplayQr[]>([])
const warranties = ref<Warranty[]>([])
const selectedWarrantyId = ref('')
const scanInput = ref('')
const scanResult = ref<ApiRecord | null>(null)
const loading = ref(false)
const scanLoading = ref(false)
const error = ref<string | null>(null)
const copied = ref<string | null>(null)

const isAdmin = computed(() => auth.isAdmin)

const asDataUrl = (image?: string | null): string | null => {
  if (!image) return null
  if (image.startsWith('data:image')) return image
  return `data:image/png;base64,${image}`
}

const toRawPayload = (payload: QrPayload): string => JSON.stringify(payload)

const renderFallbackQr = async (rawPayload: string): Promise<string> => QRCode.toDataURL(rawPayload, {
  errorCorrectionLevel: 'M',
  margin: 2,
  width: 320,
  color: {
    dark: '#07111f',
    light: '#fffaf0',
  },
})

const makeDisplayQr = async (input: {
  title: string
  subtitle: string
  token: string
  payload: QrPayload
  image?: string | null
  expiresText?: string
}): Promise<DisplayQr> => {
  const rawPayload = toRawPayload(input.payload)
  return {
    title: input.title,
    subtitle: input.subtitle,
    token: input.token,
    rawPayload,
    image: asDataUrl(input.image) ?? await renderFallbackQr(rawPayload),
    expiresText: input.expiresText,
  }
}

const loadUserQr = async (): Promise<void> => {
  const payload = await qrApi.user()
  const token = String(payload.token ?? '')
  userQr.value = token
    ? await makeDisplayQr({
        title: '會員識別 QR',
        subtitle: '出示給店家掃描，可查詢會員與保固資料。',
        token,
        payload: { type: 'MOTOR_WARRANTY_QR', token },
        image: typeof payload.qrImage === 'string' ? payload.qrImage : null,
        expiresText: payload.expiresIn ? `約 ${Math.floor(Number(payload.expiresIn) / 3600)} 小時後更新` : undefined,
      })
    : null
}

const loadWarranties = async (): Promise<void> => {
  warranties.value = await warrantiesApi.list()
  selectedWarrantyId.value = warranties.value[0]?.id ?? ''
  if (selectedWarrantyId.value) await loadWarrantyQr()
}

const loadWarrantyQr = async (): Promise<void> => {
  warrantyQr.value = null
  if (!selectedWarrantyId.value) return
  const payload = await qrApi.warranty(selectedWarrantyId.value)
  const warrantyId = String(payload.warrantyId ?? selectedWarrantyId.value)
  warrantyQr.value = await makeDisplayQr({
    title: '保固 QR',
    subtitle: '掃描後可查詢指定保固、車輛、會員與服務紀錄。',
    token: warrantyId,
    payload: { type: 'WARRANTY_QR', warrantyId },
    image: typeof payload.qrImage === 'string' ? payload.qrImage : null,
  })
}

const loadRewardQrs = async (): Promise<void> => {
  const payload = await rewardsApi.myRedemptions()
  const redemptions = unwrapList<ApiRecord>(payload).map(normalizeRedemption).filter((item) => item.id)
  const pending = redemptions.filter((item) => item.status !== 'REDEEMED' && item.status !== 'CANCELED').slice(0, 3)
  rewardQrs.value = await Promise.all(pending.map(async (item: RewardRedemption) => {
    let detail: ApiRecord | null = null
    try {
      detail = await rewardsApi.redemptionQr(item.id)
    } catch {
      detail = null
    }
    const qrPayload = (detail?.qrPayload ?? item.qrPayload) as QrPayload | null | undefined
    const token = String(qrPayload?.token ?? detail?.token ?? item.code ?? item.redemptionId ?? item.id)
    return makeDisplayQr({
      title: item.reward?.name ? `獎勵核銷：${item.reward.name}` : '獎勵核銷 QR',
      subtitle: '店家掃描後可確認或取消兌換。',
      token,
      payload: qrPayload?.type === 'REWARD_REDEMPTION' ? qrPayload : { type: 'REWARD_REDEMPTION', token },
      image: typeof detail?.qrImage === 'string' ? detail.qrImage : item.qrImage,
      expiresText: item.expiresAt ? `有效至 ${dateTime(item.expiresAt)}` : undefined,
    })
  }))
}

const loadAll = async (): Promise<void> => {
  loading.value = true
  error.value = null
  try {
    await Promise.all([
      isAdmin.value ? Promise.resolve() : loadUserQr(),
      isAdmin.value ? Promise.resolve() : loadWarranties(),
      isAdmin.value ? Promise.resolve() : loadRewardQrs(),
    ])
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'QR 資料載入失敗'
  } finally {
    loading.value = false
  }
}

const copyText = async (text: string, label: string): Promise<void> => {
  await navigator.clipboard.writeText(text)
  copied.value = label
  window.setTimeout(() => {
    if (copied.value === label) copied.value = null
  }, 1600)
}

const normalizedScanPayload = (raw: string): { reward: boolean; value: string } => {
  const trimmed = raw.trim()
  try {
    const parsed = JSON.parse(trimmed) as QrPayload
    if (parsed.type === 'REWARD_REDEMPTION' && parsed.token) return { reward: true, value: parsed.token }
    return { reward: false, value: trimmed }
  } catch {
    return { reward: false, value: toRawPayload({ type: 'MOTOR_WARRANTY_QR', token: trimmed }) }
  }
}

const resultStatus = (result: ApiRecord | null): string => {
  const direct = result?.status
  if (typeof direct === 'string') return direct
  const data = result?.data
  if (data && typeof data === 'object') {
    const status = (data as { status?: unknown }).status
    if (typeof status === 'string') return status
  }
  return ''
}

const scan = async (): Promise<void> => {
  if (!scanInput.value.trim()) return
  scanLoading.value = true
  scanResult.value = null
  try {
    const normalized = normalizedScanPayload(scanInput.value)
    scanResult.value = normalized.reward
      ? await rewardsApi.scanRedemption(normalized.value)
      : await qrApi.scan(normalized.value)
  } finally {
    scanLoading.value = false
  }
}

onMounted(loadAll)
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="QR 會員與核銷"
      description="會員、保固與獎勵核銷皆顯示可掃描 QR Code；相機掃描尚未在網頁端實作時，可使用手動輸入作為備援。"
    >
      <template #actions>
        <button class="btn-secondary" :disabled="loading" @click="loadAll">
          <RefreshCw class="h-4 w-4" />
          重新整理
        </button>
      </template>
    </PageHeader>

    <PageState :loading="loading" :error="error">
      <div v-if="!isAdmin" class="stagger-children grid gap-6 xl:grid-cols-3">
        <section v-if="userQr" class="qr-card hover-lift">
          <div>
            <p class="label">{{ userQr.title }}</p>
            <h2 class="mt-2 text-xl font-bold text-white">{{ userQr.subtitle }}</h2>
          </div>
          <img :src="userQr.image ?? ''" alt="會員 QR Code" class="qr-image" />
          <div class="space-y-2">
            <p class="break-all rounded-lg border border-white/10 bg-black/25 p-3 text-xs text-slate-300">{{ userQr.token }}</p>
            <p v-if="userQr.expiresText" class="text-xs text-amber-100">{{ userQr.expiresText }}</p>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <button class="btn-secondary" :class="{ 'copy-pop': copied === 'member' }" @click="copyText(userQr.token, 'member')">
              <Copy class="h-4 w-4" />
              {{ copied === 'member' ? '已複製' : '複製 Token' }}
            </button>
            <button class="btn-primary" @click="loadUserQr">
              <RefreshCw class="h-4 w-4" />
              更新
            </button>
          </div>
        </section>
        <section v-else class="qr-card hover-lift justify-center">
          <h2 class="text-xl font-bold text-white">尚未取得會員 QR</h2>
          <p class="text-sm text-slate-400">後端未回傳 token，請重新整理後再試。</p>
          <button class="btn-primary" @click="loadUserQr">重試</button>
        </section>

        <section class="qr-card hover-lift">
          <div>
            <p class="label">保固 QR</p>
            <h2 class="mt-2 text-xl font-bold text-white">指定保固快速查驗</h2>
          </div>
          <select v-model="selectedWarrantyId" class="field" @change="loadWarrantyQr">
            <option value="">選擇保固</option>
            <option v-for="item in warranties" :key="item.id" :value="item.id">
              {{ item.vehicle?.plate ?? item.id }} · {{ item.status }}
            </option>
          </select>
          <template v-if="warrantyQr">
            <img :src="warrantyQr.image ?? ''" alt="保固 QR Code" class="qr-image" />
            <p class="break-all rounded-lg border border-white/10 bg-black/25 p-3 text-xs text-slate-300">{{ warrantyQr.token }}</p>
            <button class="btn-secondary" :class="{ 'copy-pop': copied === 'warranty' }" @click="copyText(warrantyQr.rawPayload, 'warranty')">
              <Copy class="h-4 w-4" />
              {{ copied === 'warranty' ? '已複製' : '複製掃描內容' }}
            </button>
          </template>
          <p v-else class="rounded-lg border border-dashed border-white/15 p-4 text-sm text-slate-400">目前沒有可顯示的保固 QR。</p>
        </section>

        <section class="qr-card hover-lift">
          <div>
            <p class="label">獎勵核銷 QR</p>
            <h2 class="mt-2 text-xl font-bold text-white">待核銷兌換券</h2>
          </div>
          <div v-if="rewardQrs.length" class="space-y-4">
            <article v-for="item in rewardQrs" :key="item.token" class="hover-lift rounded-lg border border-white/10 bg-white/[0.04] p-3">
              <p class="font-semibold text-white">{{ item.title }}</p>
              <img :src="item.image ?? ''" alt="獎勵核銷 QR Code" class="mx-auto my-3 h-44 w-44 rounded-lg bg-white p-2" />
              <p class="break-all text-xs text-slate-400">{{ item.token }}</p>
              <p v-if="item.expiresText" class="mt-1 text-xs text-amber-100">{{ item.expiresText }}</p>
              <button class="btn-secondary mt-3 w-full" :class="{ 'copy-pop': copied === item.token }" @click="copyText(item.rawPayload, item.token)">
                <Copy class="h-4 w-4" />
                {{ copied === item.token ? '已複製' : '複製掃描內容' }}
              </button>
            </article>
          </div>
          <p v-else class="rounded-lg border border-dashed border-white/15 p-4 text-sm text-slate-400">目前沒有待核銷獎勵。</p>
        </section>
      </div>

      <section v-reveal class="surface rounded-lg p-5">
        <div class="flex flex-col gap-2">
          <p class="label">手動掃描備援</p>
          <h2 class="text-xl font-bold text-white">輸入 QR 內容或 Token 查詢</h2>
          <p class="text-sm text-slate-400">網頁端目前保留手動輸入；若貼上獎勵 QR JSON，會自動走獎勵核銷端點。</p>
        </div>
        <form class="mt-4 grid min-w-0 gap-3 sm:grid-cols-[minmax(0,1fr)_auto]" @submit.prevent="scan">
          <input v-model="scanInput" class="field" placeholder="貼上 QR JSON，或輸入會員 Token" />
          <button class="btn-primary w-full sm:w-auto" :disabled="scanLoading">
            <Search class="h-4 w-4" />
            {{ scanLoading ? '查詢中' : '查詢' }}
          </button>
        </form>

        <Transition name="result-fade">
        <div v-if="scanResult" class="mt-5 rounded-lg border border-emerald-300/20 bg-emerald-300/10 p-4">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <p class="font-bold text-white">{{ scanResult.resultType ?? scanResult.status ?? '查詢結果' }}</p>
            <StatusBadge :value="resultStatus(scanResult)" />
          </div>
          <pre class="mt-3 max-h-96 overflow-auto rounded-lg bg-black/30 p-3 text-xs text-slate-200">{{ scanResult }}</pre>
        </div>
        </Transition>
      </section>
    </PageState>
  </div>
</template>

<style scoped>
.qr-card {
  display: flex;
  max-width: 100%;
  min-width: 0;
  min-height: 100%;
  flex-direction: column;
  gap: 1rem;
  border: 1px solid rgba(248, 199, 107, 0.22);
  border-radius: 0.5rem;
  background:
    linear-gradient(145deg, rgba(255, 255, 255, 0.09), rgba(255, 255, 255, 0.025)),
    radial-gradient(circle at 20% 0%, rgba(248, 199, 107, 0.16), transparent 18rem);
  padding: 1.25rem;
  box-shadow: 0 30px 90px rgba(0, 0, 0, 0.34), inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

.qr-image {
  margin: 0 auto;
  height: min(18rem, 70vw);
  width: min(18rem, 70vw);
  border-radius: 0.5rem;
  background: #fffaf0;
  padding: 0.75rem;
  box-shadow: 0 18px 50px rgba(0, 0, 0, 0.34);
}
</style>
