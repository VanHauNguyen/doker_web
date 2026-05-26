<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { uploadApi, vehiclesApi } from '@/api'
import PageHeader from '@/components/PageHeader.vue'
import PageState from '@/components/PageState.vue'
import FieldGrid from '@/components/FieldGrid.vue'
import UploadButton from '@/components/UploadButton.vue'
import { getVehicleCoverImage, vehicleDisplayName } from '@/utils/vehicleImage'
import type { Vehicle } from '@/types/backend'

const vehicles = ref<Vehicle[]>([])
const form = ref<Partial<Vehicle>>({ plate: '', brand: '', model: '', year: undefined, color: '', mileage: undefined, note: '' })
const loading = ref(false)
const error = ref<string | null>(null)

const load = async (): Promise<void> => {
  loading.value = true
  error.value = null
  try {
    vehicles.value = await vehiclesApi.list()
  } catch (err) {
    error.value = err instanceof Error ? err.message : '愛車資料載入失敗'
  } finally {
    loading.value = false
  }
}

const create = async (): Promise<void> => {
  await vehiclesApi.create(form.value)
  form.value = { plate: '', brand: '', model: '', year: undefined, color: '', mileage: undefined, note: '' }
  await load()
}

const updateVehicleImage = async (vehicle: Vehicle, url: string): Promise<void> => {
  await vehiclesApi.updateImage(vehicle.id, url)
  await load()
}

const uploadImage = async (vehicle: Vehicle, event: Event): Promise<void> => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  const result = await uploadApi.single(file)
  await vehiclesApi.updateImage(vehicle.id, result.url)
  await load()
}

onMounted(load)
</script>

<template>
  <div class="space-y-6">
    <PageHeader title="愛車資料" description="愛車資料會用於安裝訂單、服務流程與保固啟用。" />
    <form class="surface grid gap-3 rounded-lg p-4 md:grid-cols-4" @submit.prevent="create">
      <input v-model="form.plate" class="field" placeholder="車牌" required />
      <input v-model="form.brand" class="field" placeholder="品牌" />
      <input v-model="form.model" class="field" placeholder="車型" />
      <input v-model.number="form.year" class="field" placeholder="年份" type="number" />
      <input v-model="form.color" class="field" placeholder="顏色" />
      <input v-model.number="form.mileage" class="field" placeholder="里程" type="number" />
      <input v-model="form.note" class="field md:col-span-2" placeholder="備註" />
      <button class="btn-primary">新增愛車</button>
    </form>
    <PageState :loading="loading" :error="error" :empty="!vehicles.length" empty-title="尚未建立愛車資料" empty-detail="新增車輛後，可用於安裝商品與保固流程。">
    <div class="grid gap-4 lg:grid-cols-3">
      <article v-for="vehicle in vehicles" :key="vehicle.id" class="surface rounded-lg p-4">
        <div class="group mb-4 h-40 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800 to-slate-950">
          <img v-if="getVehicleCoverImage({ vehicle })" :src="getVehicleCoverImage({ vehicle }) ?? undefined" :alt="vehicle.plate" class="h-full w-full object-cover opacity-0 transition duration-500" @load="($event.target as HTMLElement).classList.remove('opacity-0')" />
          <div v-else class="grid h-full place-items-center text-center">
            <p class="text-3xl font-black text-slate-600">{{ vehicle.plate?.slice(0, 2) ?? 'DK' }}</p>
            <p class="mt-2 text-xs font-bold text-slate-500">尚未上傳車輛照片</p>
          </div>
        </div>
        <p class="mb-3 text-lg font-black text-white">{{ vehicleDisplayName(vehicle) }}</p>
        <FieldGrid :items="[
          { label: '車牌', value: vehicle.plate },
          { label: '品牌 / 車型', value: `${vehicle.brand ?? '-'} ${vehicle.model ?? ''}` },
          { label: '年份', value: vehicle.year },
          { label: '里程', value: vehicle.mileage },
          { label: '顏色', value: vehicle.color },
          { label: '已驗證', value: vehicle.verified ? '是' : '否' },
        ]" />
        <div class="mt-4 flex flex-wrap gap-2">
          <UploadButton @uploaded="(url) => updateVehicleImage(vehicle, url)" />
          <label class="btn-secondary cursor-pointer">
          上傳照片
          <input class="hidden" type="file" accept="image/*" @change="uploadImage(vehicle, $event)" />
          </label>
        </div>
      </article>
    </div>
    </PageState>
  </div>
</template>
