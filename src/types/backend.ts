export type Role = 'ADMIN' | 'CUSTOMER'
export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PAID'
  | 'PROCESSING'
  | 'PREPARING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'CANCELED'
  | 'CANCELLED'
  | 'FAILED'
  | 'EXPIRED'
export type OrderType = 'SERVICE' | 'PRODUCT' | 'HYBRID'
export type DeliveryMethod =
  | 'STORE_PICKUP'
  | 'STORE_INSTALLATION'
  | 'CVS_PICKUP_COD'
  | 'CVS_PICKUP_PREPAID'
  | 'HOME_DELIVERY'
export type OrderPaymentMethod = 'ONLINE_PAYMENT' | 'STORE_PAYMENT' | 'CVS_COD' | 'HOME_COD'
export type FulfillmentStatus =
  | 'PREPARING'
  | 'READY_FOR_PICKUP'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'PICKED_UP'
  | 'COMPLETED'
  | 'CANCELED'
export type WarrantyStatus = 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'CANCELED' | 'REVOKED'
export type WarrantyType = 'PERMANENT' | 'LIMITED'
export type DurationUnit = 'DAY' | 'MONTH' | 'YEAR'
export type WarrantyAction = 'REPAIR' | 'REPLACE' | 'INSPECTION'
export type OtpType = 'REGISTER' | 'RESET_PASSWORD' | 'CHANGE_EMAIL' | 'DELETE_ACCOUNT'
export type NewsType = 'NEWS' | 'PROMO' | 'TIP'
export type PaymentProvider = 'FAKE' | 'ECPAY' | 'LINE_PAY' | 'MANUAL'
export type PaymentMethod = 'CREDIT_CARD' | 'ATM' | 'CVS' | 'BARCODE' | 'LINE_PAY' | 'CASH'
export type PaymentStatus = 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED' | 'CANCELED' | 'EXPIRED' | 'REFUNDED'
export type RewardType = 'DISCOUNT' | 'FREE_SERVICE' | 'PRODUCT' | 'INSPECTION'
export type RewardRedemptionStatus = 'PENDING' | 'REDEEMED' | 'CANCELED' | 'EXPIRED'
export type CouponType = 'FIXED_AMOUNT' | 'PERCENTAGE'

export interface ApiList<T> {
  data: T[]
  total?: number
  page?: number
  limit?: number
}

export interface User {
  id: string
  name: string
  email: string
  phone?: string | null
  avatarUrl?: string | null
  role: Role
  createdAt?: string
  currentPoints?: number
  lifetimeSpending?: string | number
  membershipTier?: MembershipTier | null
}

export interface AuthResponse {
  access_token: string
  refresh_token: string
  user: User
}

export interface Vehicle {
  id: string
  plate: string
  brand?: string | null
  model?: string | null
  year?: number | null
  color?: string | null
  mileage?: number | null
  note?: string | null
  imageUrl?: string | null
  verified?: boolean
  user?: User
  createdAt?: string
}

export interface ServiceItem {
  id: string
  name: string
  description?: string | null
  price: number
  warrantyType: WarrantyType
  durationValue?: number | null
  durationUnit?: DurationUnit | null
  isActive: boolean
}

export interface ProductImage {
  id?: string
  url: string
  publicId?: string | null
  alt?: string | null
  sortOrder?: number
}

export interface ProductVariant {
  id: string
  sku?: string | null
  priceOverride?: string | number | null
  stock: number
  imageUrl?: string | null
  options: Record<string, string>
  isActive: boolean
  requiresInstallation?: boolean
  requiresVehicleInfo?: boolean
  warrantyEligible?: boolean
  warrantyType?: WarrantyType | null
  warrantyDurationValue?: number | null
  warrantyDurationUnit?: DurationUnit | null
  installationLabel?: string | null
}

export interface Product {
  id: string
  categoryId?: string | null
  name: string
  slug: string
  sku?: string | null
  description?: string | null
  price: string | number
  stock: number
  isActive: boolean
  images?: ProductImage[]
  variants?: ProductVariant[]
  optionGroups?: ProductOptionGroup[]
  category?: Category | null
  averageRating?: string | number
  ratingCount?: number
  reviewCount?: number
}

export interface ProductOptionGroup {
  id?: string
  productId?: string
  name: string
  sortOrder?: number
  values: ProductOptionValue[]
}

export interface ProductOptionValue {
  id?: string
  optionGroupId?: string
  value: string
  sortOrder?: number
}

export interface ProductReview {
  id: string
  userId: string
  productId: string
  orderId?: string | null
  orderItemId?: string | null
  productVariantId?: string | null
  rating: number
  comment?: string | null
  images?: string[] | null
  selectedOptions?: Record<string, string> | null
  createdAt?: string
  user?: Pick<User, 'id' | 'name'> & { avatarUrl?: string | null }
}

export interface Category {
  id: string
  name: string
  slug: string
  description?: string | null
  isActive: boolean
}

export interface CartItem {
  id: string
  productId: string
  productVariantId?: string | null
  quantity: number
  product: Product
  productVariant?: ProductVariant | null
  totalPrice?: number
}

export interface Cart {
  id?: string
  items: CartItem[]
  subtotal?: number
  total?: number
}

export interface Order {
  id: string
  requestId?: string | null
  status: OrderStatus
  orderType: OrderType
  userId: string
  vehicleId?: string | null
  serviceId?: string | null
  fulfillmentStatus?: FulfillmentStatus | null
  deliveryMethod?: DeliveryMethod | null
  paymentMethod?: OrderPaymentMethod | null
  subtotalAmount?: string | number | null
  discountAmount?: string | number | null
  shippingFee?: string | number | null
  totalAmount?: string | number | null
  couponCode?: string | null
  note?: string | null
  recipientName?: string | null
  recipientPhone?: string | null
  recipientEmail?: string | null
  city?: string | null
  district?: string | null
  address?: string | null
  postalCode?: string | null
  cvsStoreType?: string | null
  cvsStoreId?: string | null
  cvsStoreName?: string | null
  cvsStoreAddress?: string | null
  trackingNumber?: string | null
  logisticsProvider?: string | null
  paidAt?: string | null
  shippedAt?: string | null
  deliveredAt?: string | null
  pickedUpAt?: string | null
  completedAt?: string | null
  canceledAt?: string | null
  user?: User
  vehicle?: Vehicle | null
  service?: ServiceItem | null
  items?: OrderItem[]
  warranties?: Warranty[]
  createdAt: string
}

export interface OrderItem {
  id: string
  orderId?: string
  itemType?: 'SERVICE' | 'PRODUCT'
  serviceId?: string | null
  productId?: string | null
  productVariantId?: string | null
  name: string
  sku?: string | null
  quantity: number
  unitPrice: string | number
  totalPrice: string | number
  selectedOptions?: Record<string, string> | null
  requiresInstallation?: boolean
  requiresVehicleInfo?: boolean
  warrantyEligible?: boolean
  warrantyType?: WarrantyType | null
  warrantyDurationValue?: number | null
  warrantyDurationUnit?: DurationUnit | null
  installationLabel?: string | null
  vehicleSnapshot?: Record<string, unknown> | null
  metadata?: Record<string, unknown> | null
}

export interface Warranty {
  id: string
  type: WarrantyType
  status: WarrantyStatus
  startedAt: string
  expiredAt?: string | null
  orderId: string
  vehicleId: string
  userId: string
  vehicle?: Vehicle
  user?: User
  order?: Order
  logs?: WarrantyLog[]
}

export interface WarrantyLog {
  id: string
  warrantyId: string
  action: WarrantyAction
  note?: string | null
  createdBy?: string | null
  createdAt: string
}

export interface NotificationItem {
  id: string
  title: string
  body: string
  type: string
  data?: Record<string, unknown> | null
  isRead: boolean
  createdAt: string
}

export interface NewsItem {
  id: string
  title: string
  content: string
  imageUrl?: string | null
  type: NewsType
  isPublished: boolean
  publishedAt?: string | null
  createdAt: string
}

export interface ChatRoom {
  id: string
  userId: string
  adminId?: string | null
  user?: User
  messages?: ChatMessage[]
  updatedAt?: string
}

export interface ChatMessage {
  id: string
  roomId: string
  senderId: string
  content: string
  isRead: boolean
  createdAt: string
}

export interface MembershipTier {
  id: string
  name: string
  description?: string | null
  thresholdAmount: string | number
  pointEarnRate: string | number
  benefits?: Record<string, unknown> | null
  sortOrder: number
  isActive: boolean
  createdAt?: string
  updatedAt?: string
  deletedAt?: string | null
}

export interface Reward {
  id: string
  name: string
  description?: string | null
  type: RewardType
  pointsCost: number
  discountAmount?: string | number | null
  discountPercent?: string | number | null
  productId?: string | null
  stock?: number | null
  imageUrl?: string | null
  isActive: boolean
  startsAt?: string | null
  expiresAt?: string | null
  startDate?: string | null
  endDate?: string | null
  product?: Product | null
  createdAt?: string
  updatedAt?: string
  deletedAt?: string | null
  pointCost?: number
}

export interface RewardTask {
  key: string
  title: string
  group: string
  points: number
  frequency?: string
  completed: boolean
  progress?: number
  target?: number
  earnedPoints?: number
}

export interface RewardRedemption {
  id: string
  redemptionId?: string
  userId?: string
  rewardId?: string
  status?: RewardRedemptionStatus
  pointsSpent: number
  pointsDeducted?: number
  code?: string | null
  remainingPoints?: number
  redeemedAt?: string | null
  expiresAt?: string | null
  qrPayload?: { type: 'REWARD_REDEMPTION'; token: string } | null
  qrImage?: string | null
  qrImageUrl?: string | null
  canceledAt?: string | null
  createdAt?: string
  updatedAt?: string
  reward?: Reward
}

export interface Coupon {
  id: string
  code?: string
  name: string
  description?: string | null
  type: CouponType
  value: string | number
  discountValue?: number
  minimumSpend?: string | number | null
  minSpend?: number | null
  maxDiscount?: number | null
  usageLimit?: number | null
  perUserLimit?: number | null
  usedCount?: number
  perUserUsedCount?: number
  membershipTierId?: string | null
  membershipTier?: MembershipTier | null
  assignments?: CouponAssignment[]
  usageCondition?: string | null
  applicability?: {
    scope: 'GLOBAL' | 'PRODUCT' | 'CATEGORY' | 'KEYWORD'
    label: string
    productIds?: string[]
    productSlugs?: string[]
    categoryIds?: string[]
    categorySlugs?: string[]
    keywords?: string[]
  } | null
  applicabilityLabel?: string | null
  claimStatus?: string
  applyStatus?: string
  canUse?: boolean
  invalidReason?: string | null
  claimedAt?: string | null
  usedAt?: string | null
  isActive: boolean
  startsAt?: string | null
  expiresAt?: string | null
  startDate?: string | null
  endDate?: string | null
  createdAt?: string
  updatedAt?: string
  deletedAt?: string | null
}

export interface CouponAssignment {
  id: string
  couponId: string
  userId: string
  user?: Pick<User, 'id' | 'name' | 'email' | 'phone'> | null
  claimedAt?: string | null
  usedAt?: string | null
  expiresAt?: string | null
  isActive?: boolean
}

export interface Payment {
  id: string
  orderId: string
  userId: string
  provider: PaymentProvider
  method: PaymentMethod
  status: PaymentStatus
  amount: string | number
  currency: string
  paymentUrl?: string | null
  createdAt: string
  updatedAt?: string
  order?: Order
  user?: User
}

export interface PointTransaction {
  id: string
  userId: string
  type: string
  points: number
  balanceAfter: number
  reason?: string | null
  createdAt: string
}

export type ApiRecord = Record<string, unknown>
