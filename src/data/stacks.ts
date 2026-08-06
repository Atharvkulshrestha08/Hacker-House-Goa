import type { Stack } from '../types'

export const STACKS: Stack[] = [
  {
    id: 'ai-ml',
    label: 'AI / ML',
    classes: ['MODEL WHISPERER', 'LATENT LORAX', 'GRADIENT RIDER', 'TENSOR TAMER'],
  },
  {
    id: 'frontend',
    label: 'Frontend',
    classes: ['PIXEL ARCHITECT', 'CSS CARPENTER', 'DOM DOMINATOR', 'LAYOUT LORD'],
  },
  {
    id: 'backend',
    label: 'Backend',
    classes: ['SYSTEMS FORGER', 'API ALCHEMIST', 'DATABASE DRAKE', 'SERVER SHAMAN'],
  },
  {
    id: 'full-stack',
    label: 'Full Stack',
    classes: ['STACK SHAPESHIFTER', 'FULL-STACK SORCERER', 'END-TO-END EXECUTOR', 'ALL-LAYER ARCHITECT'],
  },
  {
    id: 'mobile',
    label: 'Mobile',
    classes: ['SCREENSMITH', 'KERNEL KEITH', 'APP AMBASSADOR', 'GESTURE GENIE'],
  },
  {
    id: 'web3',
    label: 'Web3',
    classes: ['CHAIN ALCHEMIST', 'BLOCK BRAHMIN', 'HASH HERALD', 'LEDGER LORD'],
  },
  {
    id: 'blockchain',
    label: 'Blockchain',
    classes: ['LEDGER LEGEND', 'CONTRACT CRAFTSMAN', 'BLOCKSMITH', 'NODE NINJA'],
  },
  {
    id: 'security',
    label: 'Cybersecurity',
    classes: ['PACKET HUNTER', 'VAULT VIGILANTE', 'FIREWALL FALCON', 'ZERO-DAY ZEN MASTER'],
  },
  {
    id: 'ui-ux',
    label: 'UI / UX',
    classes: ['INTERFACE ALCHEMIST', 'FLOW SHAPER', 'UX SHERPA', 'WIREFRAME WHISPERER'],
  },
  {
    id: 'product',
    label: 'Product',
    classes: ['PROBLEM HUNTER', 'ROADMAP RIDER', 'VISION VANGUARD', 'USER VOICE'],
  },
  {
    id: 'gamedev',
    label: 'Game Development',
    classes: ['WORLD BUILDER', 'PIXEL PLAYWRIGHT', 'LAG SLAYER', 'BOSS LEVEL BRAIN'],
  },
  {
    id: 'devops',
    label: 'DevOps',
    classes: ['PIPELINE PILOT', 'CLOUD COMMANDER', 'DOCKER DREAMER', 'INFRA ORCHESTRATOR'],
  },
  {
    id: 'data',
    label: 'Data',
    classes: ['SIGNAL HUNTER', 'TABLE TAMER', 'QUERY QUEEN', 'DATASET DETECTIVE'],
  },
  {
    id: 'other',
    label: 'Other',
    classes: ['BUILDER', 'MAVERICK', 'HACKER', 'CONSTRUCTOR'],
  },
]

export const getStack = (id: string): Stack | undefined => STACKS.find((s) => s.id === id)

export function getBuilderClass(stackId: string, seed: number): string {
  const stack = getStack(stackId) ?? getStack('other')!
  return stack.classes[seed % stack.classes.length]
}

export function rerollBuilderClass(stackId: string, current: string): string {
  const stack = getStack(stackId) ?? getStack('other')!
  if (stack.classes.length <= 1) return current
  const options = stack.classes.filter((c) => c !== current)
  return options[Math.floor(Math.random() * options.length)]
}

export function makeSeed(): number {
  return Math.floor(Math.random() * 1_000_000)
}
