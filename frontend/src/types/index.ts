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

export interface SoundChangeExample {
  proto: string; modern: string; language: string
}
export interface SoundChangeRule {
  id: string; family: string; law: string; name: string
  from: string; to: string; matchers: string[]
  basis: string; condition: string; exception: string
  exceptionPatterns: { pattern: RegExp; reason: string }[]
  examples: SoundChangeExample[]
}
export interface DerivationStep {
  index: number; form: string; rule: string
  basis: string; condition: string; exception: string
  status: 'applied' | 'assumed'
}
export interface DerivationResult {
  status: 'success' | 'unverified' | 'failed'
  verified: boolean
  steps: DerivationStep[]
  stopCondition?: string; failureReason?: string
}
