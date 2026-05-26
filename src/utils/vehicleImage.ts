import { apiBaseUrl } from '@/api/client'
import type { ApiRecord, Vehicle } from '@/types/backend'

export type VehicleImageSource = {
  vehicle?: Partial<Vehicle> | null
  snapshot?: ApiRecord | null
  images?: unknown
}

const isImageUrl = (value: unknown): value is string =>
  typeof value === 'string' && Boolean(value.trim())

export const resolveAssetUrl = (value?: string | null): string | null => {
  if (!value) return null
  const trimmed = value.trim()
  if (!trimmed) return null
  if (/^(https?:)?\/\//i.test(trimmed) || trimmed.startsWith('data:') || trimmed.startsWith('blob:')) return trimmed
  try {
    return new URL(trimmed.startsWith('/') ? trimmed : `/${trimmed}`, apiBaseUrl).toString()
  } catch {
    return trimmed
  }
}

const arrayFromUnknown = (value: unknown): string[] => {
  if (!Array.isArray(value)) return []
  return value.filter(isImageUrl).map((item) => resolveAssetUrl(item)).filter((item): item is string => Boolean(item))
}

const snapshotImages = (snapshot?: ApiRecord | null): string[] => {
  if (!snapshot) return []
  return [
    ...arrayFromUnknown(snapshot.images),
    ...arrayFromUnknown(snapshot.vehicleImages),
    ...arrayFromUnknown(snapshot.imageUrls),
    resolveAssetUrl(isImageUrl(snapshot.imageUrl) ? snapshot.imageUrl : null),
    resolveAssetUrl(isImageUrl(snapshot.vehicleImageUrl) ? snapshot.vehicleImageUrl : null),
  ].filter((item): item is string => Boolean(item))
}

export const getVehicleImages = ({ vehicle, snapshot, images }: VehicleImageSource): string[] => {
  const resolved = [
    resolveAssetUrl(vehicle?.imageUrl ?? null),
    ...arrayFromUnknown(vehicle?.images),
    ...arrayFromUnknown(images),
    ...snapshotImages(snapshot),
  ].filter((item): item is string => Boolean(item))
  return Array.from(new Set(resolved))
}

export const getVehicleCoverImage = (source: VehicleImageSource): string | null =>
  getVehicleImages(source)[0] ?? null

export const vehicleDisplayName = (vehicle?: Partial<Vehicle> | null, snapshot?: ApiRecord | null): string => {
  const plate = vehicle?.plate ?? (typeof snapshot?.plate === 'string' ? snapshot.plate : null)
  const brand = vehicle?.brand ?? (typeof snapshot?.brand === 'string' ? snapshot.brand : null)
  const model = vehicle?.model ?? (typeof snapshot?.model === 'string' ? snapshot.model : null)
  return [plate, [brand, model].filter(Boolean).join(' ')].filter(Boolean).join(' · ') || '未提供車輛'
}
