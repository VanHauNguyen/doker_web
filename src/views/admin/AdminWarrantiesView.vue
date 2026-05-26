<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { qrApi, warrantiesApi } from '@/api'
import PremiumHero from '@/components/PremiumHero.vue'
import PageState from '@/components/PageState.vue'
import SectionCard from '@/components/SectionCard.vue'
import AdminDetailDrawer from '@/components/admin/AdminDetailDrawer.vue'
import AdminTable from '@/components/admin/AdminTable.vue'
import ConfirmDialog from '@/components/admin/ConfirmDialog.vue'
import StatusPill from '@/components/admin/StatusPill.vue'
import { dateTime } from '@/utils/format'
import { statusLabel } from '@/utils/status'
import type { Warranty, WarrantyAction, WarrantyLog } from '@/types/backend'

const warranties = ref<Warranty[]>([])
const selected = ref<Warranty | null>(null)
const pendingOrders = ref<unknown[]>([])
const note = ref('')
const action = ref<WarrantyAction>('INSPECTION')
const editingLog = ref<WarrantyLog | null>(null)
const deleteLogId = ref<string | null>(null)
const warrantyQrImage = ref<string | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

const load = async (): Promise<void> => {
  loading.value = true
  try {
    const [list, dashboard] = await Promise.all([warrantiesApi.adminList(), warrantiesApi.dashboard()])
    warranties.value = list
    pendingOrders.value = Array.isArray(dashboard.pendingOrders) ? dashboard.pendingOrders : []
  } catch (err) {
    error.value = err instanceof Error ? err.message : '保固資料載入失敗'
  } finally {
    loading.value = false
  }
}

const addLog = async (): Promise<void> => {
  if (!selected.value) return
  if (editingLog.value) {
    await warrantiesApi.updateLog(editingLog.value.id, { action: action.value, note: note.value })
  } else {
    await warrantiesApi.addLog({ warrantyId: selected.value.id, action: action.value, note: note.value })
  }
  selected.value = await warrantiesApi.detail(selected.value.id)
  const index = warranties.value.findIndex((item) => item.id === selected.value?.id)
  if (index >= 0 && selected.value) warranties.value[index] = selected.value
  note.value = ''
  editingLog.value = null
}

const selectWarranty = async (warranty: Warranty): Promise<void> => {
  selected.value = await warrantiesApi.detail(warranty.id)
  warrantyQrImage.value = null
  const qr = await qrApi.warranty(warranty.id)
  warrantyQrImage.value = typeof qr.qrImage === 'string'
    ? qr.qrImage.startsWith('data:') ? qr.qrImage : `data:image/png;base64,${qr.qrImage}`
    : null
}

const startEditLog = (log: WarrantyLog): void => {
  editingLog.value = log
  action.value = log.action
  note.value = log.note ?? ''
}

const removeLog = async (): Promise<void> => {
  if (!deleteLogId.value || !selected.value) return
  await warrantiesApi.removeLog(deleteLogId.value)
  deleteLogId.value = null
  selected.value = await warrantiesApi.detail(selected.value.id)
}

onMounted(load)
</script>

<template>
  <div class="space-y-6">
    <PremiumHero eyebrow="保固管理" title="管理保固生命週期、待建立保固訂單與服務紀錄。" description="整合保固儀表板、後台清單與服務紀錄 CRUD 端點。" />
    <div class="grid gap-4 md:grid-cols-3">
      <SectionCard title="保固總數"><p class="text-3xl font-bold text-white">{{ warranties.length }}</p></SectionCard>
      <SectionCard title="待建立保固訂單"><p class="text-3xl font-bold text-white">{{ pendingOrders.length }}</p></SectionCard>
      <SectionCard title="生效中保固"><p class="text-3xl font-bold text-white">{{ warranties.filter((item) => item.status === 'ACTIVE').length }}</p></SectionCard>
    </div>
    <PageState :loading="loading" :error="error" :empty="!warranties.length" empty-title="目前沒有保固">
    <AdminTable :columns="['車輛', '會員', '類型', '狀態', '到期', '操作']">
      <tr v-for="warranty in warranties" :key="warranty.id" class="table-row">
        <td class="px-4 py-3 font-semibold text-white">{{ warranty.vehicle?.plate ?? warranty.vehicleId }}</td>
        <td class="px-4 py-3 text-sm text-slate-300">{{ warranty.user?.name ?? warranty.userId }}</td>
        <td class="px-4 py-3">{{ statusLabel(warranty.type) }}</td>
        <td class="px-4 py-3"><StatusPill :value="warranty.status" /></td>
        <td class="px-4 py-3 text-sm text-slate-400">{{ dateTime(warranty.expiredAt) }}</td>
        <td class="px-4 py-3"><button class="btn-secondary" @click="selectWarranty(warranty)">明細與紀錄</button></td>
      </tr>
    </AdminTable>
    </PageState>

    <AdminDetailDrawer :open="Boolean(selected)" :title="selected?.vehicle?.plate ?? selected?.id ?? '保固明細'" subtitle="保固生命週期" @close="selected = null">
      <div v-if="selected" class="space-y-5">
        <div class="grid gap-3 sm:grid-cols-2">
          <div class="glass-card">
            <p class="label">狀態</p>
            <div class="mt-2"><StatusPill :value="selected.status" /></div>
            <p class="mt-2 text-sm text-slate-400">{{ statusLabel(selected.type) }} · 到期 {{ dateTime(selected.expiredAt) }}</p>
          </div>
          <div class="glass-card">
            <p class="label">會員與車輛</p>
            <p class="mt-2 font-semibold text-white">{{ selected.user?.name ?? selected.userId }}</p>
            <p class="text-sm text-slate-400">{{ selected.vehicle?.brand ?? '' }} {{ selected.vehicle?.model ?? '' }} · {{ selected.vehicle?.plate ?? '-' }}</p>
          </div>
        </div>
        <div v-if="warrantyQrImage" class="glass-card">
          <p class="label">保固 QR</p>
          <img :src="warrantyQrImage" alt="保固 QR Code" class="mx-auto mt-3 h-56 w-56 rounded-lg bg-white p-2" />
        </div>
        <form class="grid gap-3 md:grid-cols-[180px_1fr_auto]" @submit.prevent="addLog">
          <select v-model="action" class="field">
            <option value="INSPECTION">檢查</option>
            <option value="REPAIR">維修</option>
            <option value="REPLACE">更換</option>
          </select>
          <input v-model="note" class="field" placeholder="服務紀錄備註" />
          <button class="btn-primary">{{ editingLog ? '更新紀錄' : '新增紀錄' }}</button>
        </form>
        <div class="space-y-3">
          <div v-for="log in selected.logs" :key="log.id" class="rounded-lg border border-line p-3">
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="font-semibold text-white">{{ statusLabel(log.action) }}</p>
                <p class="text-sm text-slate-400">{{ log.note }} · {{ dateTime(log.createdAt) }}</p>
              </div>
              <div class="flex gap-2">
                <button class="btn-secondary" @click="startEditLog(log)">編輯</button>
                <button class="btn-danger" @click="deleteLogId = log.id">刪除</button>
              </div>
            </div>
          </div>
          <p v-if="!selected.logs?.length" class="rounded-lg border border-dashed border-line p-4 text-sm text-slate-400">尚無保固服務紀錄。</p>
        </div>
      </div>
    </AdminDetailDrawer>

    <ConfirmDialog
      :open="Boolean(deleteLogId)"
      title="刪除保固紀錄"
      message="刪除後將無法在目前後台復原，確認要刪除這筆服務紀錄？"
      confirm-label="刪除"
      tone="danger"
      @cancel="deleteLogId = null"
      @confirm="removeLog"
    />
  </div>
</template>
