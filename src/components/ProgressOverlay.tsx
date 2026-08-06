import { useEffect, useState } from 'react'
import { animate } from 'animejs'

const STEPS = ['READING PHOTO', 'FRAMING BUILDER', 'WELCOME TO GOA']

interface ProgressOverlayProps {
  label?: string
}

export default function ProgressOverlay({ label }: ProgressOverlayProps) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const timers = STEPS.map((_, i) => setTimeout(() => setIndex(i), i * 450))
    return () => timers.forEach(clearTimeout)
  }, [])

  useEffect(() => {
    if (index < STEPS.length) {
      animate('#progressText', {
        opacity: [0, 1],
        translateY: [10, 0],
        duration: 300,
        ease: 'outQuad',
      })
    }
  }, [index])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-forest/95 p-6 backdrop-blur-sm">
      <div className="w-full max-w-sm text-center text-cream">
        <div className="mx-auto mb-6 h-16 w-16 animate-float rounded-2xl bg-sun">
          <div className="flex h-full items-center justify-center">
            <span className="font-display text-3xl text-ink">🌴</span>
          </div>
        </div>
        <p id="progressText" className="font-display text-2xl uppercase tracking-wider sm:text-3xl">
          {label ?? STEPS[index] ?? STEPS[STEPS.length - 1]}
        </p>
        <div className="mx-auto mt-6 h-1.5 w-40 overflow-hidden rounded-full bg-cream/20">
          <div className="h-full w-1/3 animate-[marquee_1.2s_linear_infinite] rounded-full bg-punch" />
        </div>
      </div>
    </div>
  )
}
