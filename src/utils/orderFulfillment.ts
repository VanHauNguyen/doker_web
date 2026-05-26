import type { DeliveryMethod, FulfillmentStatus, Order, OrderPaymentMethod } from '@/types/backend'

export const DOKER_PICKUP_STORE = {
  name: '鍍客 doker 永康旗艦館',
  address: '台南市永康區復興路一巷30弄76號',
  phone: '0800300018',
}

export const DELIVERY_METHOD_OPTIONS: Array<{ value: DeliveryMethod; label: string }> = [
  { value: 'STORE_PICKUP', label: '門市自取' },
  { value: 'STORE_INSTALLATION', label: '門市安裝' },
  { value: 'CVS_PICKUP_COD', label: '超商取貨付款' },
  { value: 'CVS_PICKUP_PREPAID', label: '超商取貨不付款' },
  { value: 'HOME_DELIVERY', label: '宅配到府' },
]

export const PAYMENT_METHOD_OPTIONS: Array<{ value: OrderPaymentMethod; label: string }> = [
  { value: 'ONLINE_PAYMENT', label: '線上付款' },
  { value: 'STORE_PAYMENT', label: '門市付款' },
  { value: 'CVS_COD', label: '超商取貨付款' },
  { value: 'HOME_COD', label: '宅配貨到付款' },
]

export const PAYMENT_METHODS_BY_DELIVERY: Record<DeliveryMethod, OrderPaymentMethod[]> = {
  STORE_PICKUP: ['STORE_PAYMENT', 'ONLINE_PAYMENT'],
  STORE_INSTALLATION: ['STORE_PAYMENT', 'ONLINE_PAYMENT'],
  CVS_PICKUP_COD: ['CVS_COD'],
  CVS_PICKUP_PREPAID: ['ONLINE_PAYMENT'],
  HOME_DELIVERY: ['ONLINE_PAYMENT', 'HOME_COD'],
}

export const FULFILLMENT_STATUS_OPTIONS: Array<{ value: FulfillmentStatus; label: string }> = [
  { value: 'PREPARING', label: '備貨中' },
  { value: 'READY_FOR_PICKUP', label: '可取貨' },
  { value: 'SHIPPED', label: '已出貨' },
  { value: 'DELIVERED', label: '已送達' },
  { value: 'PICKED_UP', label: '已取貨' },
  { value: 'COMPLETED', label: '已完成' },
  { value: 'CANCELED', label: '已取消' },
]

export const deliveryMethodLabel = (value?: string | null): string =>
  DELIVERY_METHOD_OPTIONS.find((item) => item.value === value)?.label ?? '未提供'

export const paymentMethodLabel = (value?: string | null): string =>
  PAYMENT_METHOD_OPTIONS.find((item) => item.value === value)?.label ?? '未提供'

export const fulfillmentStatusLabel = (value?: string | null): string =>
  FULFILLMENT_STATUS_OPTIONS.find((item) => item.value === value)?.label ?? '備貨中'

export const isCvsDelivery = (value?: string | null): boolean =>
  value === 'CVS_PICKUP_COD' || value === 'CVS_PICKUP_PREPAID'

export const formatDeliveryDestination = (order: Pick<Order, 'deliveryMethod' | 'city' | 'district' | 'address' | 'postalCode' | 'cvsStoreType' | 'cvsStoreId' | 'cvsStoreName' | 'cvsStoreAddress'>): string => {
  if (order.deliveryMethod === 'HOME_DELIVERY') {
    return [order.postalCode, [order.city, order.district, order.address].filter(Boolean).join('')].filter(Boolean).join(' ')
  }
  if (isCvsDelivery(order.deliveryMethod)) {
    return [order.cvsStoreType, order.cvsStoreName, order.cvsStoreId ? `門市代碼 ${order.cvsStoreId}` : '', order.cvsStoreAddress].filter(Boolean).join(' · ')
  }
  if (order.deliveryMethod === 'STORE_PICKUP' || order.deliveryMethod === 'STORE_INSTALLATION') {
    return `${DOKER_PICKUP_STORE.name} · ${DOKER_PICKUP_STORE.address} · ${DOKER_PICKUP_STORE.phone}`
  }
  return '未提供'
}

export const isInstallationOrder = (order: Order): boolean =>
  order.deliveryMethod === 'STORE_INSTALLATION' ||
  Boolean(order.items?.some((item) => Boolean((item as { requiresInstallation?: unknown }).requiresInstallation)))

export const getFulfillmentFlow = (order: Order): FulfillmentStatus[] => {
  if (isInstallationOrder(order)) return ['PREPARING', 'COMPLETED']
  if (order.deliveryMethod === 'STORE_PICKUP') return ['PREPARING', 'READY_FOR_PICKUP', 'PICKED_UP', 'COMPLETED']
  if (order.deliveryMethod === 'CVS_PICKUP_COD' || order.deliveryMethod === 'CVS_PICKUP_PREPAID') return ['PREPARING', 'SHIPPED', 'DELIVERED', 'COMPLETED']
  if (order.deliveryMethod === 'HOME_DELIVERY') return ['PREPARING', 'SHIPPED', 'DELIVERED', 'COMPLETED']
  return ['PREPARING', 'COMPLETED']
}

export const getNextFulfillmentStatus = (order: Order): FulfillmentStatus | null => {
  if (order.paymentMethod === 'ONLINE_PAYMENT' && !order.paidAt) return null
  const flow = getFulfillmentFlow(order)
  const current = order.fulfillmentStatus ?? null
  if (!current) return flow[0] ?? null
  const index = flow.indexOf(current)
  return index < 0 ? flow[0] ?? null : flow[index + 1] ?? null
}

export const getOrderTimelineCurrentLabel = (order: Order): string => {
  if (order.status === 'CANCELED' || order.status === 'CANCELLED') return '已取消'
  if (order.status === 'FAILED') return '失敗'
  if (order.status === 'EXPIRED') return '已過期'
  if (order.status === 'COMPLETED' || order.fulfillmentStatus === 'COMPLETED') {
    return isInstallationOrder(order) ? '施工完成，保固已啟用' : '已完成'
  }
  if (order.fulfillmentStatus === 'PICKED_UP') return '已取貨'
  if (order.fulfillmentStatus === 'DELIVERED') return order.deliveryMethod?.startsWith('CVS') ? '已到達超商' : '已送達'
  if (order.fulfillmentStatus === 'SHIPPED' || order.status === 'SHIPPED') return '已出貨 / 配送中'
  if (order.status === 'PROCESSING' || order.status === 'PREPARING' || order.fulfillmentStatus === 'PREPARING') {
    return isInstallationOrder(order) ? '待施工 / 施工中' : '備貨中'
  }
  if (order.status === 'CONFIRMED' || order.status === 'PAID') return '店家確認'
  return '訂單成立'
}

export const getOrderTimelineSteps = (order: Order): Array<{ key: string; label: string; state: 'completed' | 'current' | 'pending' | 'failed' | 'canceled'; value?: string | null }> => {
  if (order.status === 'CANCELED' || order.status === 'CANCELLED') {
    return [
      { key: 'created', label: '訂單成立', state: 'completed', value: order.createdAt },
      { key: 'canceled', label: '已取消', state: 'canceled', value: order.canceledAt },
    ]
  }
  if (order.status === 'FAILED' || order.status === 'EXPIRED') {
    return [
      { key: 'created', label: '訂單成立', state: 'completed', value: order.createdAt },
      { key: 'failed', label: order.status === 'EXPIRED' ? '已過期' : '失敗', state: 'failed' },
    ]
  }

  const flow = isInstallationOrder(order)
    ? [
        { key: 'created', label: '訂單成立', value: order.createdAt },
        { key: 'confirmed', label: '店家確認' },
        { key: 'preparing', label: '待施工 / 施工中' },
        { key: 'completed', label: '施工完成 / 保固啟用', value: order.completedAt },
      ]
    : [
        { key: 'created', label: '訂單成立', value: order.createdAt },
        { key: 'confirmed', label: '店家確認' },
        { key: 'preparing', label: '備貨中' },
        { key: 'shipped', label: order.deliveryMethod?.startsWith('CVS') ? '配送至超商' : '配送中', value: order.shippedAt },
        { key: 'delivered', label: order.deliveryMethod?.startsWith('CVS') ? '已到達超商' : '已送達', value: order.deliveredAt },
        { key: 'completed', label: '已完成', value: order.completedAt ?? order.pickedUpAt },
      ]

  const currentLabel = getOrderTimelineCurrentLabel(order)
  const currentIndex = Math.max(0, flow.findIndex((step) => currentLabel.includes(step.label.split(' ')[0]) || step.label.includes(currentLabel.split(' ')[0])))
  const reached = order.status === 'COMPLETED' || order.fulfillmentStatus === 'COMPLETED' ? flow.length - 1 : currentIndex

  return flow.map((step, index) => ({
    ...step,
    state: index < reached ? 'completed' : index === reached ? 'current' : 'pending',
  }))
}
