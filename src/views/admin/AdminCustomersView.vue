<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { usersApi } from '@/api'
import AdminDetailDrawer from '@/components/admin/AdminDetailDrawer.vue'
import AdminTable from '@/components/admin/AdminTable.vue'
import PageHeader from '@/components/PageHeader.vue'
import type { User } from '@/types/backend'

const customers = ref<User[]>([])
const search = ref('')
const selected = ref<User | null>(null)

const load = async (): Promise<void> => {
  customers.value = (await usersApi.customers({ search: search.value || undefined, limit: 100 })).data
}

onMounted(load)
</script>

<template>
  <div class="space-y-6">
    <PageHeader title="會員管理">
      <template #actions>
        <input v-model="search" class="field w-72" placeholder="搜尋姓名、Email、手機" @input="load" />
      </template>
    </PageHeader>
    <AdminTable :columns="['姓名', 'Email', '手機', '會員等級', '點數', '角色', '操作']">
      <tr v-for="customer in customers" :key="customer.id" class="table-row">
        <td class="px-4 py-3 font-semibold text-white">{{ customer.name }}</td>
        <td class="px-4 py-3 text-sm text-slate-300">{{ customer.email }}</td>
        <td class="px-4 py-3 text-sm text-slate-400">{{ customer.phone ?? '-' }}</td>
        <td class="px-4 py-3 text-sm text-slate-400">{{ customer.membershipTier?.name ?? '-' }}</td>
        <td class="px-4 py-3 text-sm text-slate-400">{{ customer.currentPoints ?? 0 }}</td>
        <td class="px-4 py-3 text-sm text-slate-400">{{ customer.role === 'ADMIN' ? '後台管理員' : '一般會員' }}</td>
        <td class="px-4 py-3"><button class="btn-secondary" @click="selected = customer">明細</button></td>
      </tr>
    </AdminTable>

    <AdminDetailDrawer :open="Boolean(selected)" :title="selected?.name ?? '會員明細'" subtitle="會員資料" @close="selected = null">
      <div v-if="selected" class="space-y-4">
        <div class="grid gap-3 sm:grid-cols-2">
          <div class="glass-card">
            <p class="label">聯絡資訊</p>
            <p class="mt-2 text-sm text-slate-300">{{ selected.email }}</p>
            <p class="text-sm text-slate-400">{{ selected.phone ?? '未填寫手機' }}</p>
          </div>
          <div class="glass-card">
            <p class="label">會員經營</p>
            <p class="mt-2 text-sm text-slate-300">{{ selected.membershipTier?.name ?? '尚無等級' }}</p>
            <p class="text-sm text-slate-400">目前點數 {{ selected.currentPoints ?? 0 }} · 累積消費 {{ selected.lifetimeSpending ?? 0 }}</p>
          </div>
        </div>
        <p class="rounded-lg border border-line p-4 text-sm text-slate-400">後端目前僅提供管理端會員查詢，沒有管理端修改或刪除會員端點。</p>
      </div>
    </AdminDetailDrawer>
  </div>
</template>
