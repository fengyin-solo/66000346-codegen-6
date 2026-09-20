import type { SoundChangeRule, DerivationResult, DerivationStep } from '../types'
import { LANGUAGE_FAMILIES } from './data'

// 音变规则库：按语系分别校验，禁止跨语系套用
export const SOUND_CHANGE_RULES: SoundChangeRule[] = [
  {
    id: 'grimm-p', family: 'ie', law: 'Grimm 定律', name: '清塞音擦化 p→f',
    from: 'p', to: 'f', matchers: ['p'],
    basis: '第一次日耳曼语辅音转移：PIE 清塞音 *p 在日耳曼语族中擦化为 f',
    condition: '音位 p 处于自由位置（非擦音之后）；非重读环境另依 Verner 定律判定',
    exception: 's 之后的 p 不擦化（对照 spew）；Verner 定律：非重读音节后浊化',
    exceptionPatterns: [
      { pattern: /sp/, reason: 'p 位于擦音 s 之后，Grimm 擦化被阻断（对照 spew / 拉丁语 spuere）' },
    ],
    examples: [
      { proto: 'pater', modern: 'father', language: '英语' },
      { proto: 'pes', modern: 'foot', language: '英语' },
      { proto: 'piscis', modern: 'fish', language: '英语' },
    ],
  },
  {
    id: 'grimm-t', family: 'ie', law: 'Grimm 定律', name: '清塞音擦化 t→θ',
    from: 't', to: 'θ', matchers: ['t'],
    basis: '第一次日耳曼语辅音转移：PIE 清塞音 *t 在日耳曼语族中擦化为 θ（拼作 th）',
    condition: '音位 t 处于自由位置（非擦音之后）；非重读环境另依 Verner 定律判定',
    exception: 's 之后的 t 不擦化（对照 star）；Verner 定律：非重读音节后浊化',
    exceptionPatterns: [
      { pattern: /st/, reason: 't 位于擦音 s 之后，Grimm 擦化被阻断（对照 star / 拉丁语 stella）' },
    ],
    examples: [
      { proto: 'tres', modern: 'three', language: '英语' },
      { proto: 'tu', modern: 'thou', language: '英语' },
      { proto: 'dent', modern: 'tooth', language: '英语' },
    ],
  },
  {
    id: 'grimm-k', family: 'ie', law: 'Grimm 定律', name: '清塞音擦化 k→h',
    from: 'k', to: 'h', matchers: ['k', 'c'],
    basis: '第一次日耳曼语辅音转移：PIE 清塞音 *k（拉丁正字法作 c）在日耳曼语族中擦化为 h/x',
    condition: '音位 k/c 处于自由位置（非擦音之后）；非重读环境另依 Verner 定律判定',
    exception: 's 之后的 k/c 不擦化（对照 skill）；Verner 定律：非重读音节后浊化',
    exceptionPatterns: [
      { pattern: /s[kc]/, reason: 'k/c 位于擦音 s 之后，Grimm 擦化被阻断（对照 skill / 拉丁语 scire）' },
    ],
    examples: [
      { proto: 'cord', modern: 'heart', language: '英语' },
      { proto: 'canis', modern: 'hound', language: '英语' },
      { proto: 'centum', modern: 'hundred', language: '英语' },
    ],
  },
  {
    id: 'st-devoice', family: 'st', law: '中古汉语声母清化', name: '全浊声母清化 b→p',
    from: 'b', to: 'p', matchers: ['b'],
    basis: '中古汉语全浊声母（並母 *b-）在普通话中清化为清塞音',
    condition: '浊音位于词首声母位置；平声字送气、仄声字不送气',
    exception: '仄声字不送气（如 白 bái）；吴语等方言保留浊音，不在本规则范围',
    exceptionPatterns: [],
    examples: [
      { proto: 'bæŋ', modern: 'píng（平）', language: '汉语' },
      { proto: 'buan', modern: 'pán（盘）', language: '汉语' },
    ],
  },
  {
    id: 'aa-w', family: 'aa', law: '原始闪语词首音变', name: '词首滑音 w→y',
    from: 'w', to: 'y', matchers: ['w'],
    basis: '原始闪语词首 *w 在希伯来语等西北闪语中变为 y',
    condition: 'w 必须位于词首；词中 w 保留不变',
    exception: '词中位置的 w 不变化（对照 阿拉伯语 awliya）',
    exceptionPatterns: [
      { pattern: /^[^w]/, reason: 'w 不在词首位置，词中 w 保留（对照 阿拉伯语 awliya）' },
    ],
    examples: [
      { proto: 'walad', modern: 'yeled（孩子）', language: '希伯来语' },
      { proto: 'waraqa', modern: 'yaroq（绿）', language: '希伯来语' },
    ],
  },
  {
    id: 'ural-grad', family: 'ural', law: '芬兰语辅音弱化', name: '长塞音弱化 kk→k',
    from: 'kk', to: 'k', matchers: ['kk'],
    basis: '芬兰语辅音级别交替：强级长塞音 kk 在弱化环境中变为单塞音 k',
    condition: 'kk 后接闭音节（属格等屈折形式）时触发弱化',
    exception: '主格等开音节环境保留强级 kk，不弱化',
    exceptionPatterns: [],
    examples: [
      { proto: 'kukka', modern: 'kukan（属格）', language: '芬兰语' },
      { proto: 'pappi', modern: 'papin（属格）', language: '芬兰语' },
    ],
  },
]

// 已有三组对照结论（保留展示，可一键载入推演）
export const VERIFIED_CONCLUSIONS = [
  { ruleId: 'grimm-p', proto: 'pater', modern: 'father', label: 'p→f' },
  { ruleId: 'grimm-t', proto: 'tres', modern: 'three', label: 't→θ' },
  { ruleId: 'grimm-k', proto: 'cord', modern: 'heart', label: 'k→h' },
]

function familyName(id: string): string {
  return LANGUAGE_FAMILIES.find(f => f.id === id)?.name || id
}

function fail(stopCondition: string, failureReason: string): DerivationResult {
  return { status: 'failed', verified: false, steps: [], stopCondition, failureReason }
}

export function deriveSoundChange(ruleId: string, familyId: string, rawInput: string): DerivationResult {
  const input = rawInput.trim().toLowerCase()
  if (!input)
    return fail('空输入', '输入为空：无法定位音位环境，推演在起始步骤前终止。')
  const rule = SOUND_CHANGE_RULES.find(r => r.id === ruleId)
  if (!rule)
    return fail('未知音变', `规则 "${ruleId || '（未选择）'}" 不在音变规则库中：拒绝为未知音变臆造推导链。`)
  if (rule.family !== familyId)
    return fail('规则冲突', `规则「${rule.name}」属${familyName(rule.family)}，当前校验语系为${familyName(familyId)}：跨语系套用被禁止，请切换语系或更换规则。`)
  const hit = rule.matchers.find(m => input.includes(m))
  if (!hit)
    return fail('音位缺失', `输入 "${input}" 中未检测到目标音位 ${rule.matchers.join('/')}：规则不适用，不得强行推导。`)
  for (const ep of rule.exceptionPatterns)
    if (ep.pattern.test(input))
      return fail('规则冲突', `命中例外边界：${ep.reason}。推演终止，不输出结论。`)

  const intermediate = rule.matchers.reduce((w, m) => w.split(m).join(rule.to), input)
  const example = rule.examples.find(e => e.proto.toLowerCase() === input)
  const steps: DerivationStep[] = [
    {
      index: 1, form: '*' + input, rule: '原始形式（构拟）',
      basis: '历史比较法构拟的祖语形式', condition: '—', exception: '—', status: 'applied',
    },
    {
      index: 2, form: intermediate, rule: `${rule.law}：${rule.name}`,
      basis: rule.basis, condition: rule.condition, exception: rule.exception, status: 'applied',
    },
  ]
  if (example) {
    steps.push({
      index: 3, form: example.modern, rule: `现代${example.language}词形`,
      basis: '文献与同源词对照佐证，已达判定阈值', condition: rule.condition, exception: rule.exception, status: 'applied',
    })
    return { status: 'success', verified: true, steps }
  }
  steps.push({
    index: 3, form: '*' + intermediate, rule: '推导形式（待验证）',
    basis: '机械推导结果：缺少文献佐证，未达判定阈值，仅标记为假设形式，不输出定论',
    condition: rule.condition, exception: rule.exception, status: 'assumed',
  })
  return { status: 'unverified', verified: false, steps }
}
