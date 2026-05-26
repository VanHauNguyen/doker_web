<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { categoriesApi, productsApi, servicesApi } from '@/api'
import PremiumHero from '@/components/PremiumHero.vue'
import AdminDetailDrawer from '@/components/admin/AdminDetailDrawer.vue'
import AdminTable from '@/components/admin/AdminTable.vue'
import ConfirmDialog from '@/components/admin/ConfirmDialog.vue'
import FormField from '@/components/admin/FormField.vue'
import ImageUploader from '@/components/admin/ImageUploader.vue'
import StatusPill from '@/components/admin/StatusPill.vue'
import { money } from '@/utils/format'
import type { Category, DurationUnit, Product, ServiceItem, WarrantyType } from '@/types/backend'

const products = ref<Product[]>([])
const categories = ref<Category[]>([])
const services = ref<ServiceItem[]>([])
const productName = ref('')
const productPrice = ref(0)
const productStock = ref(0)
const productCategoryId = ref('')
const productImageUrl = ref('')
const categoryName = ref('')
const serviceName = ref('')
const servicePrice = ref(0)
const serviceWarrantyType = ref<WarrantyType>('LIMITED')
const serviceDurationValue = ref(6)
const serviceDurationUnit = ref<DurationUnit>('MONTH')
const selectedProduct = ref<Product | null>(null)
const selectedService = ref<ServiceItem | null>(null)
const selectedCategory = ref<Category | null>(null)
const deleteTarget = ref<{ type: 'product' | 'service' | 'category' | 'image'; id: string; imageId?: string } | null>(null)

const load = async (): Promise<void> => {
  const [productPayload, categoryPayload, servicePayload] = await Promise.all([
    productsApi.adminList({ limit: 50 }),
    categoriesApi.adminList(),
    servicesApi.list(),
  ])
  products.value = productPayload.data
  categories.value = categoryPayload
  services.value = servicePayload
}

const createProduct = async (): Promise<void> => {
  await productsApi.create({
    name: productName.value,
    price: productPrice.value,
    stock: productStock.value,
    categoryId: productCategoryId.value || undefined,
    images: productImageUrl.value ? [{ url: productImageUrl.value, sortOrder: 0 }] : undefined,
    isActive: true,
  })
  productName.value = ''
  productPrice.value = 0
  productStock.value = 0
  productCategoryId.value = ''
  productImageUrl.value = ''
  await load()
}

const createService = async (): Promise<void> => {
  await servicesApi.create({
    name: serviceName.value,
    price: servicePrice.value,
    warrantyType: serviceWarrantyType.value,
    durationValue: serviceDurationValue.value,
    durationUnit: serviceDurationUnit.value,
    isActive: true,
  })
  serviceName.value = ''
  servicePrice.value = 0
  await load()
}

const createCategory = async (): Promise<void> => {
  await categoriesApi.create({ name: categoryName.value, slug: categoryName.value.trim().toLowerCase().replace(/\s+/g, '-') })
  categoryName.value = ''
  await load()
}

const addProductImage = async (url: string): Promise<void> => {
  if (!selectedProduct.value) return
  await productsApi.addImage(selectedProduct.value.id, { url, sortOrder: selectedProduct.value.images?.length ?? 0 })
  await load()
  selectedProduct.value = products.value.find((item) => item.id === selectedProduct.value?.id) ?? null
}

const saveProduct = async (): Promise<void> => {
  if (!selectedProduct.value) return
  await productsApi.update(selectedProduct.value.id, selectedProduct.value)
  await load()
}

const saveService = async (): Promise<void> => {
  if (!selectedService.value) return
  await servicesApi.update(selectedService.value.id, selectedService.value)
  await load()
}

const saveCategory = async (): Promise<void> => {
  if (!selectedCategory.value) return
  await categoriesApi.update(selectedCategory.value.id, selectedCategory.value)
  await load()
}

const confirmDelete = async (): Promise<void> => {
  if (!deleteTarget.value) return
  const target = deleteTarget.value
  if (target.type === 'product') await productsApi.remove(target.id)
  if (target.type === 'service') await servicesApi.remove(target.id)
  if (target.type === 'category') await categoriesApi.remove(target.id)
  if (target.type === 'image' && target.imageId) await productsApi.removeImage(target.id, target.imageId)
  deleteTarget.value = null
  await load()
}

onMounted(load)
</script>

<template>
  <div class="space-y-6">
    <PremiumHero eyebrow="商品與服務管理" title="管理商品、服務、分類、庫存與圖片。" description="串接商品、分類、服務、庫存、上傳與商品圖片後端端點。" />
    <div class="grid gap-6 lg:grid-cols-3">
      <form class="surface space-y-3 rounded-lg p-4" @submit.prevent="createProduct">
        <h2 class="font-bold text-white">建立商品</h2>
        <FormField label="名稱"><input v-model="productName" class="field" placeholder="商品名稱" required /></FormField>
        <FormField label="分類">
          <select v-model="productCategoryId" class="field">
            <option value="">不指定分類</option>
            <option v-for="category in categories" :key="category.id" :value="category.id">{{ category.name }}</option>
          </select>
        </FormField>
        <FormField label="價格"><input v-model.number="productPrice" class="field" type="number" min="0" required /></FormField>
        <FormField label="庫存"><input v-model.number="productStock" class="field" type="number" min="0" required /></FormField>
        <ImageUploader v-model="productImageUrl" />
        <button class="btn-primary">建立</button>
      </form>
      <form class="surface space-y-3 rounded-lg p-4" @submit.prevent="createCategory">
        <h2 class="font-bold text-white">建立分類</h2>
        <input v-model="categoryName" class="field" placeholder="名稱" required />
        <button class="btn-primary">建立</button>
      </form>
      <form class="surface space-y-3 rounded-lg p-4" @submit.prevent="createService">
        <h2 class="font-bold text-white">建立服務</h2>
        <input v-model="serviceName" class="field" placeholder="名稱" required />
        <input v-model.number="servicePrice" class="field" type="number" min="0" placeholder="價格" required />
        <select v-model="serviceWarrantyType" class="field">
          <option value="LIMITED">有限保固</option>
          <option value="PERMANENT">永久保固</option>
        </select>
        <div class="grid grid-cols-2 gap-3">
          <input v-model.number="serviceDurationValue" class="field" type="number" min="1" />
          <select v-model="serviceDurationUnit" class="field">
            <option value="DAY">日</option>
            <option value="MONTH">月</option>
            <option value="YEAR">年</option>
          </select>
        </div>
        <button class="btn-primary">建立</button>
      </form>
    </div>
    <AdminTable :columns="['商品', '分類', '庫存', '價格', '狀態', '操作']">
      <tr v-for="product in products" :key="product.id" class="table-row">
        <td class="px-4 py-3 font-semibold text-white">{{ product.name }}</td>
        <td class="px-4 py-3 text-sm text-slate-400">{{ product.category?.name ?? product.categoryId ?? '-' }}</td>
        <td class="px-4 py-3">{{ product.stock }}</td>
        <td class="px-4 py-3">{{ money(product.price) }}</td>
        <td class="px-4 py-3"><StatusPill :value="product.isActive ? 'ACTIVE' : 'INACTIVE'" /></td>
        <td class="flex flex-wrap gap-2 px-4 py-3">
          <button class="btn-secondary" @click="selectedProduct = { ...product }">編輯</button>
          <button class="btn-secondary" @click="productsApi.adjustInventory(product.id, { action: 'INCREASE', quantity: 1, reason: 'ADMIN_ADJUST' }).then(load)">庫存 +1</button>
          <button class="btn-danger" @click="deleteTarget = { type: 'product', id: product.id }">刪除</button>
        </td>
      </tr>
    </AdminTable>
    <section class="surface rounded-lg p-5">
      <h2 class="font-bold text-white">分類</h2>
      <div class="mt-3 flex flex-wrap gap-2">
        <button v-for="category in categories" :key="category.id" class="rounded-full border border-line px-3 py-1 text-sm text-slate-300" @click="selectedCategory = { ...category }">{{ category.name }}</button>
      </div>
    </section>
    <section class="surface rounded-lg p-5">
      <h2 class="font-bold text-white">服務項目</h2>
      <div class="mt-3 grid gap-3 lg:grid-cols-3">
        <div v-for="service in services" :key="service.id" class="rounded-md border border-line p-3">
          <p class="font-semibold text-white">{{ service.name }}</p>
          <p class="text-sm text-slate-400">{{ money(service.price) }}</p>
          <div class="mt-3 flex gap-2">
            <button class="btn-secondary" @click="selectedService = { ...service }">編輯</button>
            <button class="btn-danger" @click="deleteTarget = { type: 'service', id: service.id }">刪除</button>
          </div>
        </div>
      </div>
    </section>

    <AdminDetailDrawer :open="Boolean(selectedProduct)" :title="selectedProduct?.name ?? '商品明細'" subtitle="商品編輯" @close="selectedProduct = null">
      <form v-if="selectedProduct" class="space-y-4" @submit.prevent="saveProduct">
        <input v-model="selectedProduct.name" class="field" required />
        <textarea v-model="selectedProduct.description" class="field min-h-28" placeholder="商品描述" />
        <div class="grid gap-3 sm:grid-cols-2">
          <input v-model="selectedProduct.price" class="field" type="number" min="0" />
          <input v-model.number="selectedProduct.stock" class="field" type="number" min="0" />
        </div>
        <select v-model="selectedProduct.categoryId" class="field">
          <option value="">不指定分類</option>
          <option v-for="category in categories" :key="category.id" :value="category.id">{{ category.name }}</option>
        </select>
        <label class="inline-flex items-center gap-2 text-sm text-slate-300">
          <input v-model="selectedProduct.isActive" type="checkbox" />
          啟用商品
        </label>
        <ImageUploader @update:model-value="addProductImage" />
        <div class="grid gap-3 sm:grid-cols-2">
          <div v-for="image in selectedProduct.images" :key="image.id ?? image.url" class="overflow-hidden rounded-lg border border-line">
            <img :src="image.url" alt="商品圖片" class="h-32 w-full object-cover" />
            <button v-if="image.id" class="btn-danger w-full rounded-none" type="button" @click="deleteTarget = { type: 'image', id: selectedProduct!.id, imageId: image.id }">刪除圖片</button>
          </div>
        </div>
        <button class="btn-primary">儲存商品</button>
      </form>
    </AdminDetailDrawer>

    <AdminDetailDrawer :open="Boolean(selectedService)" :title="selectedService?.name ?? '服務明細'" subtitle="服務編輯" @close="selectedService = null">
      <form v-if="selectedService" class="space-y-4" @submit.prevent="saveService">
        <input v-model="selectedService.name" class="field" required />
        <textarea v-model="selectedService.description" class="field min-h-28" />
        <input v-model.number="selectedService.price" class="field" type="number" min="0" />
        <select v-model="selectedService.warrantyType" class="field">
          <option value="LIMITED">有限保固</option>
          <option value="PERMANENT">永久保固</option>
        </select>
        <label class="inline-flex items-center gap-2 text-sm text-slate-300">
          <input v-model="selectedService.isActive" type="checkbox" />
          啟用服務
        </label>
        <button class="btn-primary">儲存服務</button>
      </form>
    </AdminDetailDrawer>

    <AdminDetailDrawer :open="Boolean(selectedCategory)" :title="selectedCategory?.name ?? '分類明細'" subtitle="分類編輯" @close="selectedCategory = null">
      <form v-if="selectedCategory" class="space-y-4" @submit.prevent="saveCategory">
        <input v-model="selectedCategory.name" class="field" required />
        <input v-model="selectedCategory.slug" class="field" required />
        <textarea v-model="selectedCategory.description" class="field min-h-24" />
        <label class="inline-flex items-center gap-2 text-sm text-slate-300">
          <input v-model="selectedCategory.isActive" type="checkbox" />
          啟用分類
        </label>
        <div class="flex gap-3">
          <button class="btn-primary">儲存分類</button>
          <button class="btn-danger" type="button" @click="deleteTarget = { type: 'category', id: selectedCategory!.id }">刪除分類</button>
        </div>
      </form>
    </AdminDetailDrawer>

    <ConfirmDialog
      :open="Boolean(deleteTarget)"
      title="確認刪除"
      message="此操作會呼叫後端刪除端點，確認後無法在目前後台復原。"
      confirm-label="刪除"
      tone="danger"
      @cancel="deleteTarget = null"
      @confirm="confirmDelete"
    />
  </div>
</template>
