export type OutputType = 'id' | 'pfp'

export interface Stack {
  id: string
  label: string
  classes: string[]
}

export interface BuilderInfo {
  name: string
  stackId: string
  customStack?: string
}

export interface ProcessedPhoto {
  fileName: string
  mimeType: string
  width: number
  height: number
  objectUrl: string
  placeholder?: string
}

export interface BuilderMember extends BuilderInfo {
  id: string
  photo: ProcessedPhoto | null
  builderClass: string
}

export interface Viewport {
  x: number
  y: number
  scale: number
}

export const OUTPUT_SIZES = {
  id: { width: 2400, height: 1600 },
  pfp: { width: 1080, height: 1080 },
} as const
