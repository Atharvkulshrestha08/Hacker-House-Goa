import { useCallback, useRef, useState, type DragEvent } from 'react'
import type { DecodedImage, ProcessedPhoto } from '../lib/image'
import { processPhoto, PhotoError } from '../lib/image'

export type UploadError = 'unsupported' | 'corrupt' | null

interface UploadZoneProps {
  onPhoto: (processed: ProcessedPhoto, image: DecodedImage) => void
  onError: (kind: 'unsupported' | 'corrupt') => void
  onBusy: (busy: boolean) => void
  accent?: boolean
}

export default function UploadZone({ onPhoto, onError, onBusy, accent = false }: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  const handleFile = useCallback(
    async (file: File | undefined | null) => {
      if (!file) return
      onBusy(true)
      try {
        const { processed, image } = await processPhoto(file)
        onPhoto(processed, image)
      } catch (err) {
        onError(err instanceof PhotoError && err.kind === 'unsupported' ? 'unsupported' : 'corrupt')
      } finally {
        onBusy(false)
      }
    },
    [onPhoto, onError, onBusy],
  )

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    void handleFile(file)
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,.jpg,.jpeg,.jpe,.jif,.jfif,.pjpeg,.pjp,.png,.apng,.gif,.webp,.avif,.svg,.ico,.cur,.bmp,.tif,.tiff,.heic,.heif,.ai,.eps,.pdf,.psd,.indd,.raw,.cr2,.nef,.arw,.dng,.orf,.rw2,.pef,.srw"
        className="sr-only"
        onChange={(e) => void handleFile(e.target.files?.[0])}
      />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={(e) => void handleFile(e.target.files?.[0])}
      />

      <div
        role="button"
        tabIndex={0}
        aria-label="Upload a photo"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            inputRef.current?.click()
          }
        }}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`group flex min-h-[220px] cursor-pointer flex-col items-center justify-center gap-3 rounded-3xl border-4 border-dashed p-6 text-center transition-all duration-300 sm:min-h-[260px] ${
          dragOver
            ? 'scale-[1.01] border-punch bg-punch/10'
            : accent
              ? 'border-punch/60 bg-cream hover:border-punch hover:bg-punch/5'
              : 'border-forest/40 bg-cream hover:border-forest'
        }`}
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-forest text-2xl text-sun transition-transform duration-300 group-hover:-translate-y-1">
          📸
        </div>
        <div>
          <p className="font-display text-lg uppercase text-ink sm:text-xl">
            Your face goes here
          </p>
          <p className="mt-1 text-xs text-ink/60 sm:text-sm">
            Tap to choose · Drag &amp; drop · JPG, PNG, HEIC
          </p>
        </div>
        <div className="flex w-full flex-col items-center justify-center gap-2 sm:flex-row">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              inputRef.current?.click()
            }}
            className="btn-sun w-full sm:w-auto"
          >
            Choose Photo
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              cameraRef.current?.click()
            }}
            className="btn-ghost w-full sm:w-auto"
          >
            Take Photo
          </button>
        </div>
      </div>
    </div>
  )
}
