import { STACKS } from '../data/stacks'

interface InfoStepProps {
  name: string
  stackId: string
  customStack: string
  onChange: (patch: { name?: string; stackId?: string; customStack?: string }) => void
  onContinue: () => void
  onBack: () => void
}

export default function InfoStep({ name, stackId, customStack, onChange, onContinue, onBack }: InfoStepProps) {
  const valid = name.trim().length >= 2 && (stackId !== 'other' ? stackId !== '' : customStack.trim().length > 0)

  return (
    <div className="space-y-5">
      <div>
        <label htmlFor="builder-name" className="mb-1.5 block text-xs font-bold uppercase tracking-[0.2em] text-ink/60">
          Your name
        </label>
        <input
          id="builder-name"
          type="text"
          value={name}
          maxLength={40}
          autoComplete="off"
          placeholder="e.g. Atharv Kulshrestha"
          onChange={(e) => onChange({ name: e.target.value })}
          className="w-full rounded-2xl border-2 border-forest/20 bg-cream px-4 py-3.5 text-base text-ink outline-none transition-colors placeholder:text-ink/35 focus:border-punch"
        />
        <p className="mt-1 text-[11px] text-ink/45">Shown on your ID — max 40 characters.</p>
      </div>

      <fieldset>
        <legend className="mb-1.5 block text-xs font-bold uppercase tracking-[0.2em] text-ink/60">
          Your stack / role
        </legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {STACKS.map((stack) => (
            <button
              key={stack.id}
              type="button"
              onClick={() => onChange({ stackId: stack.id })}
              aria-pressed={stackId === stack.id}
              className={`min-h-11 rounded-xl border-2 px-2 py-2.5 text-center text-xs font-bold uppercase tracking-wide transition-all sm:text-[13px] ${
                stackId === stack.id
                  ? 'border-punch bg-punch text-cream shadow-md'
                  : 'border-forest/20 bg-cream text-ink hover:border-forest/50'
              }`}
            >
              {stack.label}
            </button>
          ))}
        </div>
      </fieldset>

      {stackId === 'other' && (
        <div className="animate-pop">
          <label htmlFor="custom-stack" className="mb-1.5 block text-xs font-bold uppercase tracking-[0.2em] text-ink/60">
            Tell us your stack
          </label>
          <input
            id="custom-stack"
            type="text"
            value={customStack}
            maxLength={24}
            placeholder="e.g. Robotics"
            onChange={(e) => onChange({ customStack: e.target.value })}
            className="w-full rounded-2xl border-2 border-punch bg-cream px-4 py-3.5 text-base text-ink outline-none placeholder:text-ink/35"
          />
        </div>
      )}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        <button type="button" onClick={onBack} className="btn-ghost w-full sm:w-auto">
          ← Back
        </button>
        <button type="button" onClick={onContinue} disabled={!valid} className="btn-punch w-full disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto">
          Get my Builder Class →
        </button>
      </div>
    </div>
  )
}
