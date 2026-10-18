import { z } from 'zod'
import { presentationPresets, type PresentationPresetId } from './presentation'

export const platformAssetKinds = [
  'LOGO',
  'BACKGROUND',
  'HARDWARE',
  'SIDEBAR_LOGO',
  'SIDEBAR_BACKGROUND',
  'SIDEBAR_HARDWARE',
] as const
const placementSchema = z.object({
  logoWidth: z.number().min(10).max(60).default(47),
  logoHeight: z.number().min(30).max(160).default(100),
  logoY: z.number().min(0).max(70).default(16),
  hardwareWidth: z.number().min(20).max(100).default(56),
  hardwareX: z.number().min(-30).max(30).default(0),
  hardwareY: z.number().min(-30).max(30).default(0),
  backgroundX: z.number().min(0).max(100).default(50),
  backgroundY: z.number().min(0).max(100).default(50),
})
export const platformCustomizationSchema = z.object({
  title: z.string().trim().min(1).max(100).nullable().default(null),
  shortName: z.string().trim().min(1).max(30).nullable().default(null),
  dateLabel: z
    .string()
    .trim()
    .regex(/^\d{4}(?:[–-]\d{4})?$/, 'Saisissez une année ou une période, par exemple 1998–2002.')
    .nullable()
    .default(null),
  preset: z
    .enum(Object.keys(presentationPresets) as [PresentationPresetId, ...PresentationPresetId[]])
    .nullable()
    .default(null),
  cardEnabled: z.boolean().default(false),
  card: placementSchema.prefault({}),
  sidebarMode: z.enum(['artwork', 'composition']).default('artwork'),
  sidebar: placementSchema.prefault({ hardwareWidth: 90 }),
  hiddenAssets: z.array(z.enum(platformAssetKinds)).max(6).default([]),
})
export type PlatformCustomization = z.infer<typeof platformCustomizationSchema>
export type PlatformPlacement = PlatformCustomization['card']
export function readPlatformCustomization(value: unknown): PlatformCustomization {
  const parsed = platformCustomizationSchema.safeParse(value)
  return parsed.success ? parsed.data : platformCustomizationSchema.parse({})
}
export function customizePlatform<
  T extends { name: string; shortName: string; customization: unknown },
>(platform: T) {
  const { customization: stored, ...catalog } = platform
  const customization = readPlatformCustomization(stored)
  return {
    ...catalog,
    catalogName: platform.name,
    catalogShortName: platform.shortName,
    name: customization.title ?? platform.name,
    shortName: customization.shortName ?? platform.shortName,
    customization,
  }
}
