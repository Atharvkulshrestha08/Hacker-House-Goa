const ITEMS = [
  'FRAME YOURSELF IN GOA',
  'HACKER HOUSE GOA 2026',
  '#FRAMEINGOA',
  'BUILDER ID · PFP · SQUAD',
  'YOUR PHOTO STAYS ON YOUR DEVICE',
]

export default function Marquee() {
  const row = [...ITEMS, ...ITEMS]
  return (
    <div
      className="marquee overflow-hidden bg-forest py-2.5 text-cream"
      aria-hidden="true"
    >
      <div className="marquee-track flex w-max items-center gap-8 whitespace-nowrap">
        {row.map((item, i) => (
          <span key={i} className="flex items-center gap-8">
            <span className="font-display text-sm uppercase tracking-wide">{item}</span>
            <span className="h-2 w-2 rotate-45 bg-punch" />
          </span>
        ))}
      </div>
    </div>
  )
}
