export interface WordNode {
  id: string; word: string; language: string; meaning: string
  family: string; era?: string; x?: number; y?: number
}
export interface WordLink {
  source: string; target: string
  type: 'cognate' | 'derived' | 'borrowed' | 'reconstructed'
  description?: string
}
export interface CognateSet {
  root: string; meaning: string
  languages: Record<string, string>
  period: string; family: string
}
export interface LanguageFamily {
  id: string; name: string; color: string; languages: string[]; era: string
}

// ── 音变规则推演 ──────────────────────────────────────────────
export type DeriveStatus = 'applied' | 'skipped' | 'no_change' | 'blocked' | 'conflict'

export interface RuleContext {
  raw: string
  chars: string[]
  index: number
  prev: string | null
  next: string | null
}

export type RuleJudge = (ctx: RuleContext) => {
  status: DeriveStatus
  reason: string
}

export interface SoundRule {
  id: string
  from: string
  to: string
  title: string
  basis: string
  condition: string
  exception: string
  note: string
  examples: string[]
  judge: RuleJudge
}

export interface RulePack {
  familyId: string
  familyName: string
  scope: string
  target: string
  cards: { ruleId: string; example: string; label: string }[]
  normalize?: (s: string) => string
  knownConsonants: string[]
  knownVowels: string[]
  rules: SoundRule[]
}

export interface DeriveStep {
  index: number
  char: string
  kind: 'consonant' | 'vowel' | 'punct' | 'modifier'
  status: DeriveStatus
  output: string
  ruleId: string | null
  detail: string
}

export type DeriveFailCode =
  | 'EMPTY_INPUT'
  | 'UNKNOWN_PHONEME'
  | 'RULE_BLOCKED'
  | 'RULE_CONFLICT'
  | 'FAMILY_MISMATCH'
  | 'EXPECTED_MISMATCH'

export interface DeriveResult {
  ok: boolean
  failCode: DeriveFailCode | null
  failReason: string
  stoppedAtIndex: number | null
  steps: DeriveStep[]
  output: string | null
  expected: string | null
  match: boolean
  familyId: string
  ruleId: string
  preNote: string | null
}
