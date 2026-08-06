import { useEffect, useRef, useState, type PointerEvent } from 'react'
import type { DecodedImage } from '../lib/image'
import { drawCoveredImage } from '../lib/image'
import type { DrawViewport } from '../lib/image'

const REGION_W = 1150
const REGION_H = 800
const PREVIEW_SCALE = 0.6

interface RepositionStepProps {
  image: DecodedImage
  srcW: number
  srcH: number
  viewport: DrawViewport
  onChange: (viewport: DrawViewport) => void
  onContinue: () => void
  onBack: () => void
}

export default function RepositionStep({
  image,
  srcW,
  srcH,
  viewport,
  onChange,
  onContinue,
  onBack,
}: RepositionStepProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const pointers = useRef<Map<number, { x: number; y: number }>>(new Map())
  const lastPinch = useRef<number | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    canvas.width = REGION_W * PREVIEW_SCALE
    canvas.height = REGION_H * PREVIEW_SCALE
    ctx.fillStyle = '#0a3d2e'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    drawCoveredImage(ctx, image, 0, 0, canvas.width, canvas.height, srcW, srcH, viewport)
  }, [image, srcW, srcH, viewport])

  const panBounds = () => {
    const scale = Math.max(canvasRef.current!.width / srcW, canvasRef.current!.height / srcH)
    const scaledW = srcW * scale * viewport.scale
    const scaledH = srcH * scale * viewport.scale
    return {
      x: Math.max(0, (scaledW - canvasRef.current!.width) / (2 * canvasRef.current!.width)),
      y: Math.max(0, (scaledH - canvasRef.current!.height) / (2 * canvasRef.current!.height)),
    }
  }

  const clampViewport = (next: DrawViewport): DrawViewport => {
    const { x, y } = panBounds()
    return {
      scale: Math.min(4, Math.max(0.5, next.scale)),
      x: Math.min(x, Math.max(-x, next.x)),
      y: Math.min(y, Math.max(-y, next.y)),
    }
  }

  const onPointerDown = (e: PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    lastPinch.current = null
    if (pointers.current.size === 1) setIsDragging(true)
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()]
      lastPinch.current = Math.hypot(a.x - b.x, a.y - b.y)
    }
  }

  const onPointerMove = (e: PointerEvent<HTMLCanvasElement>) => {
    const prev = pointers.current.get(e.pointerId)
    if (!prev) return
    const next = { x: e.clientX, y: e.clientY }
    pointers.current.set(e.pointerId, next)

    if (pointers.current.size === 1 && isDragging) {
      const cssW = wrapRef.current?.clientWidth ?? canvasRef.current!.clientWidth
      const dx = (next.x - prev.x) / cssW
      const dy = (next.y - prev.y) / cssW
      onChange(clampViewport({ ...viewport, x: viewport.x + dx, y: viewport.y + dy }))
    }

    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()]
      const dist = Math.hypot(a.x - b.x, a.y - b.y)
      if (lastPinch.current) {
        const factor = dist / lastPinch.current
        onChange(clampViewport({ ...viewport, scale: viewport.scale * factor }))
      }
      lastPinch.current = dist
    }
  }

  const onPointerUp = (e: PointerEvent<HTMLCanvasElement>) => {
    pointers.current.delete(e.pointerId)
    lastPinch.current = null
    if (pointers.current.size === 0) setIsDragging(false)
  }

  const onWheel = (e: React.WheelEvent) => {
    const factor = Math.exp(-e.deltaY * 0.0015)
    onChange(clampViewport({ ...viewport, scale: viewport.scale * factor }))
  }

  const zoom = (factor: number) => onChange(clampViewport({ ...viewport, scale: viewport.scale * factor }))

  return (
    <div className="space-y-4">
      <div className="rounded-3xl border-4 border-forest bg-forest p-2">
        <div ref={wrapRef} className="overflow-hidden rounded-2xl">
          <canvas
            ref={canvasRef}
            className="block w-full cursor-grab touch-none select-none active:cursor-grabbing"
            style={{ aspectRatio: `${REGION_W} / ${REGION_H}` }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onWheel={onWheel}
            aria-label="Drag to reposition your photo, scroll or pinch to zoom"
          />
        </div>
        <p className="mt-2 px-1 pb-1 text-center text-xs text-cream/70">
          Drag to move · Pinch or scroll to zoom · Automatic framing is fine too
        </p>
      </div>

      <div className="flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => zoom(1 / 1.25)}
          className="btn-ghost h-11 w-11 rounded-full p-0 text-lg"
          aria-label="Zoom out"
        >
          −
        </button>
        <button
          type="button"
          onClick={() => onChange({ x: 0, y: 0, scale: 1 })}
          className="btn-ghost"
        >
          Reset
        </button>
        <button
          type="button"
          onClick={() => zoom(1.25)}
          className="btn-ghost h-11 w-11 rounded-full p-0 text-lg"
          aria-label="Zoom in"
        >
          +
        </button>
      </div>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        <button type="button" onClick={onBack} className="btn-ghost w-full sm:w-auto">
          ← Back
        </button>
        <button type="button" onClick={onContinue} className="btn-punch w-full sm:w-auto">
          Looks good →
        </button>
      </div>
    </div>
  )
}
