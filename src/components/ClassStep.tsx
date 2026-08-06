import { animate } from 'animejs'
import { useEffect, useRef } from 'react'
import { getStack } from '../data/stacks'

interface ClassStepProps {
  name: string
  stackId: string
  customStack: string
  builderClass: string
  onReroll: () => void
  onContinue: () => void
  onBack: () => void
}

export default function ClassStep({
  name,
  stackId,
  customStack,
  builderClass,
  onReroll,
  onContinue,
  onBack,
}: ClassStepProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const stack = getStack(stackId)
  const stackLabel = stackId === 'other' ? customStack : stack?.label ?? 'BUILDER'

  useEffect(() => {
    if (cardRef.current) {
      animate(cardRef.current, {
        rotate: [0, 0],
        scale: [0.9, 1],
        opacity: [0, 1],
        duration: 500,
        ease: 'outBack',
      })
    }
  }, [builderClass])

  const firstName = name.trim().split(' ')[0] || 'Builder'

  return (
    <div className="space-y-5 text-center">
      <div>
        <p className="eyebrow mb-2">Assignment confirmed</p>
        <h2 className="font-display text-3xl uppercase leading-none text-ink sm:text-4xl">
          {firstName}, your Builder Class is
        </h2>
      </div>

      <div
        ref={cardRef}
        className="relative mx-auto max-w-md rounded-3xl bg-punch p-6 text-cream shadow-xl sm:p-8"
      >
        <span className="absolute -right-3 -top-3 rounded-full bg-sun px-3 py-1 font-display text-sm text-ink">
          2026
        </span>
        <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-butter">
          {stackLabel}
        </p>
        <p className="mt-2 font-display text-4xl uppercase leading-none sm:text-5xl">
          {builderClass}
        </p>
        <p className="mt-3 font-editorial text-xl italic text-cream/90">
          Reporting to Goa, 28–31 Oct.
        </p>
      </div>

      <button type="button" onClick={onReroll} className="btn-sun mx-auto w-full sm:w-auto">
        🔄 Reroll Class
      </button>

      <p className="text-xs text-ink/50">
        Don&apos;t like it? Reroll — instant, no AI, no waiting.
      </p>

      <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-between">
        <button type="button" onClick={onBack} className="btn-ghost w-full sm:w-auto">
          ← Back
        </button>
        <button type="button" onClick={onContinue} className="btn-primary w-full sm:w-auto">
          Generate my ID →
        </button>
      </div>
    </div>
  )
}
