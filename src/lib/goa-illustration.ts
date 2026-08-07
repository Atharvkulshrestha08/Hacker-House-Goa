/**
 * goa-illustration.ts
 *
 * Returns an SVG string of the Goa coastal illustration that matches
 * the reference image: lush green hills, turquoise lagoon, sandy beach,
 * Portuguese church with yellow walls & red roof, tall palm trees with fronds,
 * hot air balloon, white sailboat, fluffy clouds, birds.
 *
 * The SVG viewBox is 1060 × 640 — fits the illustration panel on the canvas.
 */
export function buildGoaSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1060 640" width="1060" height="640">
  <defs>
    <!-- Sky: light blue-green at top, fading to warm cream at horizon -->
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"   stop-color="#c8eedc"/>
      <stop offset="55%"  stop-color="#e8f5e0"/>
      <stop offset="100%" stop-color="#f5e8b0"/>
    </linearGradient>

    <!-- Water: deep turquoise -->
    <linearGradient id="water" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"   stop-color="#3ab5a0"/>
      <stop offset="100%" stop-color="#1a8a7a"/>
    </linearGradient>

    <!-- Green hills -->
    <linearGradient id="hill1" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"   stop-color="#2e8b50"/>
      <stop offset="100%" stop-color="#1a6b38"/>
    </linearGradient>
    <linearGradient id="hill2" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"   stop-color="#3da060"/>
      <stop offset="100%" stop-color="#228844"/>
    </linearGradient>
    <linearGradient id="hill3" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"   stop-color="#4ab870"/>
      <stop offset="100%" stop-color="#2a9a50"/>
    </linearGradient>
  </defs>

  <!-- === SKY === -->
  <rect width="1060" height="640" fill="url(#sky)"/>

  <!-- Horizon haze strip -->
  <rect x="0" y="310" width="1060" height="40" fill="#f5e8b0" opacity="0.6"/>

  <!-- === CLOUDS (white fluffy blobs) === -->
  <!-- Cloud 1 — upper centre-right -->
  <g fill="white" opacity="0.92">
    <ellipse cx="680" cy="90"  rx="72" ry="42"/>
    <ellipse cx="630" cy="102" rx="48" ry="32"/>
    <ellipse cx="732" cy="106" rx="50" ry="30"/>
    <ellipse cx="680" cy="112" rx="78" ry="28"/>
  </g>
  <!-- Cloud 2 — upper right -->
  <g fill="white" opacity="0.85">
    <ellipse cx="880" cy="130" rx="56" ry="34"/>
    <ellipse cx="834" cy="142" rx="36" ry="24"/>
    <ellipse cx="928" cy="144" rx="40" ry="22"/>
    <ellipse cx="880" cy="152" rx="60" ry="22"/>
  </g>
  <!-- Cloud 3 — upper left -->
  <g fill="white" opacity="0.75">
    <ellipse cx="170" cy="110" rx="44" ry="26"/>
    <ellipse cx="136" cy="120" rx="30" ry="20"/>
    <ellipse cx="206" cy="120" rx="32" ry="18"/>
    <ellipse cx="170" cy="128" rx="48" ry="18"/>
  </g>

  <!-- === SUN (large yellow circle, left side) === -->
  <circle cx="118" cy="260" r="66" fill="#f9d030" opacity="0.95"/>
  <!-- Sun glow -->
  <circle cx="118" cy="260" r="90" fill="#f9d030" opacity="0.15"/>

  <!-- === BACK GREEN HILLS (dark, far background) === -->
  <path d="M0,340 Q160,200 320,280 Q480,200 640,260 Q800,180 1060,250 L1060,400 L0,400 Z" fill="#1a6b38" opacity="0.7"/>

  <!-- === MID GREEN HILLS === -->
  <path d="M0,360 Q200,260 380,320 Q520,240 700,300 Q860,240 1060,290 L1060,420 L0,420 Z" fill="url(#hill1)" opacity="0.9"/>

  <!-- === FOREGROUND HILLS & GROUND === -->
  <path d="M0,390 Q180,310 350,360 Q500,290 660,350 Q820,280 1060,340 L1060,460 L0,460 Z" fill="url(#hill2)"/>

  <!-- === LAGOON / WATER === -->
  <path d="M0,430 Q265,380 530,420 Q795,380 1060,410 L1060,500 L0,500 Z" fill="url(#water)"/>
  <rect x="0" y="490" width="1060" height="150" fill="url(#water)"/>

  <!-- Water sparkle lines -->
  <g stroke="rgba(255,255,255,0.25)" stroke-width="1.5">
    <line x1="60"  y1="510" x2="140" y2="510"/>
    <line x1="200" y1="525" x2="300" y2="525"/>
    <line x1="400" y1="515" x2="520" y2="515"/>
    <line x1="600" y1="530" x2="720" y2="530"/>
    <line x1="800" y1="518" x2="900" y2="518"/>
    <line x1="960" y1="540" x2="1040" y2="540"/>
  </g>

  <!-- === SANDY BEACH STRIP === -->
  <path d="M0,468 Q265,440 530,462 Q795,440 1060,455 L1060,490 L0,490 Z" fill="#e8c97a"/>

  <!-- === PORTUGUESE CHURCH (centre) === -->
  <!-- Church complex ground -->
  <rect x="380" y="330" width="300" height="160" fill="#e8d89a" rx="4"/>

  <!-- Church main body — warm cream/yellow -->
  <rect x="420" y="260" width="220" height="230" fill="#f5dfa0" rx="6"/>

  <!-- Church façade decorative pilasters -->
  <rect x="420" y="260" width="18" height="230" fill="#e8c870"/>
  <rect x="622" y="260" width="18" height="230" fill="#e8c870"/>

  <!-- Arch windows on main body -->
  <rect x="456" y="290" width="36" height="55" fill="#6ab8d0" rx="2"/>
  <path d="M456,290 Q474,268 492,290" fill="#6ab8d0"/>
  <rect x="568" y="290" width="36" height="55" fill="#6ab8d0" rx="2"/>
  <path d="M568,290 Q586,268 604,290" fill="#6ab8d0"/>

  <!-- Main arched door -->
  <rect x="502" y="360" width="56" height="130" fill="#5a3010" rx="2"/>
  <path d="M502,360 Q530,330 558,360" fill="#5a3010"/>

  <!-- Door steps -->
  <rect x="492" y="486" width="76" height="8" fill="#c8b060"/>
  <rect x="482" y="490" width="96" height="8" fill="#c8b060"/>

  <!-- Red roof / pediment -->
  <path d="M400,262 L530,168 L660,262 Z" fill="#c03030"/>
  <!-- Roof edge highlight -->
  <path d="M400,262 L530,168 L660,262 L648,262 L530,178 L412,262 Z" fill="#a02020"/>

  <!-- Bell tower -->
  <rect x="498" y="130" width="64" height="140" fill="#f5dfa0" rx="4"/>
  <!-- Tower pilasters -->
  <rect x="498" y="130" width="10" height="140" fill="#e8c870"/>
  <rect x="552" y="130" width="10" height="140" fill="#e8c870"/>
  <!-- Tower arch window -->
  <rect x="510" y="155" width="40" height="52" fill="#6ab8d0" rx="2"/>
  <path d="M510,155 Q530,136 550,155" fill="#6ab8d0"/>
  <!-- Tower roof (pointed) -->
  <path d="M490,134 L530,72 L570,134 Z" fill="#c03030"/>
  <path d="M490,134 L530,78 L570,134 L562,134 L530,84 L498,134 Z" fill="#a02020"/>
  <!-- Cross on top -->
  <rect x="527" y="60" width="6" height="20" fill="#c9a227"/>
  <rect x="521" y="66" width="18" height="5" fill="#c9a227"/>

  <!-- === HOT AIR BALLOON (upper right of scene) === -->
  <!-- Balloon envelope -->
  <ellipse cx="820" cy="170" rx="58" ry="72" fill="#e03050"/>
  <!-- Balloon stripe panels -->
  <path d="M820,98 Q800,100 790,130 L780,200 Q790,240 820,242 Q850,240 860,200 L870,130 Q860,100 840,98 Q830,97 820,98 Z" fill="#e03050"/>
  <!-- White stripes on balloon -->
  <line x1="800" y1="100" x2="793" y2="240" stroke="rgba(255,255,255,0.28)" stroke-width="12"/>
  <line x1="820" y1="98"  x2="820" y2="242" stroke="rgba(255,255,255,0.28)" stroke-width="12"/>
  <line x1="840" y1="100" x2="847" y2="240" stroke="rgba(255,255,255,0.28)" stroke-width="12"/>
  <!-- Balloon top cap -->
  <ellipse cx="820" cy="100" rx="58" ry="10" fill="#c02040"/>
  <!-- Basket ropes -->
  <line x1="793" y1="240" x2="800" y2="270" stroke="#8b6000" stroke-width="2.5"/>
  <line x1="847" y1="240" x2="840" y2="270" stroke="#8b6000" stroke-width="2.5"/>
  <!-- Basket -->
  <rect x="795" y="268" width="50" height="28" fill="#a07030" rx="5"/>
  <rect x="795" y="268" width="50" height="28" fill="none" stroke="#704820" stroke-width="2.5" rx="5"/>
  <!-- Basket weave lines -->
  <line x1="795" y1="278" x2="845" y2="278" stroke="#704820" stroke-width="1.5"/>
  <line x1="810" y1="268" x2="810" y2="296" stroke="#704820" stroke-width="1.5"/>
  <line x1="830" y1="268" x2="830" y2="296" stroke="#704820" stroke-width="1.5"/>

  <!-- === SAILBOAT (small, on lagoon) === -->
  <!-- White sail -->
  <path d="M240,454 L250,344 L340,454 Z" fill="white" opacity="0.95"/>
  <!-- Second sail (smaller) -->
  <path d="M240,454 L230,380 L248,454 Z" fill="white" opacity="0.85"/>
  <!-- Mast -->
  <line x1="248" y1="340" x2="248" y2="458" stroke="#5a3010" stroke-width="3"/>
  <!-- Hull -->
  <path d="M218,458 L342,458 L330,476 L228,476 Z" fill="#c03030"/>
  <!-- Hull highlight -->
  <line x1="228" y1="462" x2="330" y2="462" stroke="rgba(255,255,255,0.3)" stroke-width="2"/>

  <!-- === PALM TREES === -->
  <!-- Helper: each palm is trunk + fronds + coconuts -->

  <!-- LEFT PALM 1 (tallest, leftmost, leaning slightly right) -->
  <path d="M58,640 Q74,480 90,380" stroke="#2d5a1a" stroke-width="16" fill="none" stroke-linecap="round"/>
  <!-- Fronds -->
  <path d="M90,380 Q30,340 -10,310" stroke="#1a7a30" stroke-width="9" fill="none" stroke-linecap="round"/>
  <path d="M90,380 Q50,320 60,280"  stroke="#1a7a30" stroke-width="9" fill="none" stroke-linecap="round"/>
  <path d="M90,380 Q110,310 150,290" stroke="#1a7a30" stroke-width="9" fill="none" stroke-linecap="round"/>
  <path d="M90,380 Q130,340 180,330" stroke="#1a7a30" stroke-width="9" fill="none" stroke-linecap="round"/>
  <path d="M90,380 Q80,350 50,360"  stroke="#228840" stroke-width="7" fill="none" stroke-linecap="round"/>
  <path d="M90,380 Q100,350 140,350" stroke="#228840" stroke-width="7" fill="none" stroke-linecap="round"/>
  <!-- Coconuts -->
  <circle cx="82" cy="388" r="12" fill="#7a4a18"/>
  <circle cx="96" cy="395" r="10" fill="#7a4a18"/>

  <!-- LEFT PALM 2 (shorter, next to first) -->
  <path d="M165,640 Q178,510 188,430" stroke="#2d5a1a" stroke-width="13" fill="none" stroke-linecap="round"/>
  <path d="M188,430 Q128,395 100,372" stroke="#1a7a30" stroke-width="8" fill="none" stroke-linecap="round"/>
  <path d="M188,430 Q155,368 162,335" stroke="#1a7a30" stroke-width="8" fill="none" stroke-linecap="round"/>
  <path d="M188,430 Q208,360 248,345" stroke="#1a7a30" stroke-width="8" fill="none" stroke-linecap="round"/>
  <path d="M188,430 Q228,390 265,388" stroke="#1a7a30" stroke-width="8" fill="none" stroke-linecap="round"/>
  <path d="M188,430 Q175,400 148,408" stroke="#228840" stroke-width="6" fill="none" stroke-linecap="round"/>
  <circle cx="180" cy="438" r="10" fill="#7a4a18"/>
  <circle cx="194" cy="444" r="9"  fill="#7a4a18"/>

  <!-- RIGHT PALM 1 (far right, tallest) -->
  <path d="M1002,640 Q988,480 970,378" stroke="#2d5a1a" stroke-width="16" fill="none" stroke-linecap="round"/>
  <path d="M970,378 Q1030,338 1075,308" stroke="#1a7a30" stroke-width="9" fill="none" stroke-linecap="round"/>
  <path d="M970,378 Q1010,315 1000,278" stroke="#1a7a30" stroke-width="9" fill="none" stroke-linecap="round"/>
  <path d="M970,378 Q950,310 912,292"   stroke="#1a7a30" stroke-width="9" fill="none" stroke-linecap="round"/>
  <path d="M970,378 Q930,338 882,328"   stroke="#1a7a30" stroke-width="9" fill="none" stroke-linecap="round"/>
  <path d="M970,378 Q980,348 1010,356"  stroke="#228840" stroke-width="7" fill="none" stroke-linecap="round"/>
  <circle cx="978" cy="386" r="12" fill="#7a4a18"/>
  <circle cx="962" cy="392" r="10" fill="#7a4a18"/>

  <!-- RIGHT PALM 2 -->
  <path d="M898,640 Q885,510 875,432" stroke="#2d5a1a" stroke-width="13" fill="none" stroke-linecap="round"/>
  <path d="M875,432 Q935,395 960,372"  stroke="#1a7a30" stroke-width="8" fill="none" stroke-linecap="round"/>
  <path d="M875,432 Q908,368 902,335"  stroke="#1a7a30" stroke-width="8" fill="none" stroke-linecap="round"/>
  <path d="M875,432 Q855,360 816,345"  stroke="#1a7a30" stroke-width="8" fill="none" stroke-linecap="round"/>
  <path d="M875,432 Q838,390 802,388"  stroke="#1a7a30" stroke-width="8" fill="none" stroke-linecap="round"/>
  <path d="M875,432 Q888,400 914,406"  stroke="#228840" stroke-width="6" fill="none" stroke-linecap="round"/>
  <circle cx="883" cy="440" r="10" fill="#7a4a18"/>
  <circle cx="868" cy="445" r="9"  fill="#7a4a18"/>

  <!-- === BIRDS (small V shapes in sky) === -->
  <g stroke="#1a4a2a" stroke-width="2.5" fill="none" stroke-linecap="round">
    <path d="M720,68  Q730,58 740,68"/>
    <path d="M752,52  Q762,42 772,52"/>
    <path d="M768,78  Q778,68 788,78"/>
    <path d="M800,58  Q810,48 820,58"/>
    <path d="M840,72  Q850,62 860,72"/>
  </g>

  <!-- === FOREGROUND GRASS / GREENERY === -->
  <path d="M0,580 Q130,545 260,570 Q390,545 530,560 Q660,545 800,565 Q930,545 1060,558 L1060,640 L0,640 Z" fill="#1a6b30"/>
  <path d="M0,605 Q200,578 400,595 Q600,578 800,590 Q930,578 1060,585 L1060,640 L0,640 Z" fill="#0f5a24"/>
</svg>`
}

/**
 * Load an SVG string into an HTMLImageElement, returning a promise.
 */
export function loadSvg(svgString: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const blob = new Blob([svgString], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = (e) => {
      URL.revokeObjectURL(url)
      reject(e)
    }
    img.src = url
  })
}
