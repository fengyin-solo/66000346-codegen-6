import type {
  RulePack, SoundRule, RuleContext, DeriveResult, DeriveStep, DeriveStatus, DeriveFailCode,
} from '../types'

// ── 音段分类辅助 ─────────────────────────────────────────────
const MODIFIERS = new Set(['ʰ', 'ʷ', 'ː', 'ʲ'])
const PUNCTS = new Set(['#', '-'])

const stripAsterisk = (s: string) => s.trim().replace(/^\*+/, '').trim()

function isVowel(c: string, vowels: Set<string>) { return vowels.has(c) }
function isConsonant(c: string, cons: Set<string>) { return cons.has(c) }

/**
 * 判断辅音位置之后的音节是否为闭音节（芬兰语辅音阶变适用条件）。
 * 从该辅音之后的元音 V1 起，看 V1 后的辅音丛：
 *  - 无后继辅音：开音节
 *  - 辅音丛后还有元音：该丛为下一音节首音，仅当丛长 ≥2（含韵尾）才闭
 *  - 辅音丛后无元音：丛即韵尾，闭音节
 */
function followingSyllableClosed(chars: string[], i: number, vowels: Set<string>, cons: Set<string>): boolean {
  let j = i + 1
  while (j < chars.length && !vowels.has(chars[j])) j++
  if (j >= chars.length) return false
  let k = j + 1
  const cluster: string[] = []
  while (k < chars.length && cons.has(chars[k])) { cluster.push(chars[k]); k++ }
  if (cluster.length === 0) return false
  return k < chars.length ? cluster.length >= 2 : true
}

const prevIs = (ctx: RuleContext, c: string) => ctx.prev === c
const acuteVowels = new Set(['á', 'é', 'í', 'ó', 'ú'])

// ── 印欧语系：Grimm 第一音变（原始印欧 → 原始日耳曼）────────
const iePRules: SoundRule[] = [
  {
    id: 'ie-grimm-pf', from: 'p', to: 'f',
    title: 'p → f（清唇塞音 → 清唇擦音）',
    basis: 'Grimm 定律第一组：清塞音在日耳曼语中发生擦化。例：拉丁语 pater → 英语 father。',
    condition: '词中任意位置的音位 /p/ 均适用（sP 复辅音除外）。',
    exception: 'sP 阻断：/p/ 前接 /s/ 时不发生音变（sp 保留），如拉丁语 spuere 对应 spew 而非 *sfew。',
    note: '拉丁语拼写 c 在入口处按音位 /k/ 归一处理。',
    examples: ['pater', 'pes', 'spes'],
    judge: (ctx) => prevIs(ctx, 's')
      ? { status: 'blocked', reason: '命中例外边界：/sp/ 复辅音中 p 不擦化，规则在此位置停止。' }
      : { status: 'applied', reason: '清唇塞音 /p/ 擦化为 /f/。' },
  },
  {
    id: 'ie-grimm-tt', from: 't', to: 'θ',
    title: 't → θ（清齿塞音 → 清齿擦音）',
    basis: 'Grimm 定律第二组：清塞音在日耳曼语中发生擦化。例：拉丁语 tres → 英语 three。',
    condition: '词中任意位置的音位 /t/ 均适用（st 复辅音、Verner 域除外）。',
    exception: '① /st/ 复辅音中 t 保留；② 重音后位（Verner 定律域）应作 ð 而非 θ，两规则竞争。',
    note: '输入元音带锐音符（é 等）表示重音落于该元音，用于触发 Verner 冲突判定。',
    examples: ['tres', 'status', 'patér'],
    judge: (ctx) => {
      if (prevIs(ctx, 's')) return { status: 'blocked', reason: '命中例外边界：/st/ 复辅音中 t 保留，规则在此位置停止。' }
      if (ctx.next !== null && acuteVowels.has(ctx.next))
        return { status: 'conflict', reason: '规则冲突：重音后位同时落在 Grimm（t→θ）与 Verner（t→ð）适用域内，缺少韵律消歧证据，不得越过判定阈值。' }
      return { status: 'applied', reason: '清齿塞音 /t/ 擦化为 /θ/。' }
    },
  },
  {
    id: 'ie-grimm-kh', from: 'k', to: 'h',
    title: 'k → h（清软腭塞音 → 声门擦音）',
    basis: 'Grimm 定律第三组：清塞音在日耳曼语中发生擦化。例：拉丁语 cord → 英语 heart。',
    condition: '词中任意位置的音位 /k/ 均适用（sk 复辅音除外）。',
    exception: 'sK 阻断：/k/ 前接 /s/ 时不发生音变（sk 保留）。',
    note: '圆腭化形式 kʷ 的 ʷ 为附加符号，不参与判定；拼写 c 已归一为 k。',
    examples: ['cord', 'kwesti'],
    judge: (ctx) => prevIs(ctx, 's')
      ? { status: 'blocked', reason: '命中例外边界：/sk/ 复辅音中 k 不擦化，规则在此位置停止。' }
      : { status: 'applied', reason: '清软腭塞音 /k/ 擦化为 /h/。' },
  },
]

// ── 汉藏语系：上古汉语 → 中古汉语 ───────────────────────────
const stRules: SoundRule[] = [
  {
    id: 'st-labial', from: 'p', to: 'f',
    title: 'p → f（重唇 → 轻唇，轻唇化）',
    basis: '钱大昕“古无轻唇音”：上古重唇 p 在中古三等韵前轻唇化为 f。',
    condition: '/p/ 后接三等介音 j/y 时适用。',
    exception: '后接圆唇介音 ʷ 时落入重唇保留边界，轻唇化被阻断。',
    note: 'j、y、ʷ 为介音符号，不单独参与音变；无介音时规则不触发（非失败）。',
    examples: ['pjang', 'pang', 'pʷang'],
    judge: (ctx) => {
      if (ctx.next === 'ʷ') return { status: 'blocked', reason: '命中例外边界：圆唇介音 ʷ 后重唇 p 保留，轻唇化停止。' }
      if (ctx.next === 'j' || ctx.next === 'y') return { status: 'applied', reason: '三等介音 j/y 前的重唇 /p/ 轻唇化为 /f/。' }
      return { status: 'no_change', reason: '后接非三等介音，不满足轻唇化条件，/p/ 原样保留。' }
    },
  },
  {
    id: 'st-retroflex', from: 't', to: 'ʈ',
    title: 't → ʈ（端组 → 知组，卷舌化）',
    basis: '上古 r 介音使端组舌头音卷舌化为知组。',
    condition: '/t/ 前接 /r/ 介音时适用。',
    exception: '无 r 介音时规则不触发，端母保留。',
    note: 'ʈ 为卷舌清塞音；该规则只判定 r 介音环境。',
    examples: ['rta', 'ta'],
    judge: (ctx) => prevIs(ctx, 'r')
      ? { status: 'applied', reason: 'r 介音后的 /t/ 卷舌化为 /ʈ/。' }
      : { status: 'no_change', reason: '前置 r 介音缺失，不满足卷舌化条件，/t/ 原样保留。' },
  },
]

// ── 亚非语系：原始闪米特 → 古典阿拉伯语 ─────────────────────
const aaRules: SoundRule[] = [
  {
    id: 'aa-pf', from: 'p', to: 'f',
    title: 'p → f（清唇塞音 → 清唇擦音）',
    basis: '原始闪米特 p 在阿拉伯语支中音移为 f，如原始闪米特 *pV- 对应阿拉伯语 f-。',
    condition: '阿拉伯语支域内的音位 /p/ 适用。',
    exception: '叠辅音 pp 环境中弱化规则与强化规则竞争，判定阈值不足。',
    note: '本规则包目标语支固定为阿拉伯语；希伯来语支 p 保留，属语支边界外，不适用本包。',
    examples: ['pana', 'uppu'],
    judge: (ctx) => prevIs(ctx, 'p')
      ? { status: 'conflict', reason: '规则冲突：叠辅音 pp 位置弱化（p→f）与强化（叠音保留）竞争，无消歧依据，停止推演。' }
      : { status: 'applied', reason: '阿拉伯语支内清唇塞音 /p/ 音移为 /f/。' },
  },
  {
    id: 'aa-ss', from: 'š', to: 's',
    title: 'š → s（硬腭擦音 → 齿擦音）',
    basis: '原始闪米特 *š 在古典阿拉伯语中并入 s。',
    condition: '阿拉伯语支域内的音位 /š/ 适用。',
    exception: '无登记例外。',
    note: '希伯来语支以 ś 形式另立，属语支边界外。',
    examples: ['šam', 'sap'],
    judge: () => ({ status: 'applied', reason: '原始闪米特 /š/ 在阿拉伯语支并入 /s/。' }),
  },
]

// ── 乌拉尔语系：原始芬兰语 → 芬兰语（辅音阶变）─────────────
const uralRules: SoundRule[] = [
  {
    id: 'ural-pv', from: 'p', to: 'v',
    title: 'p → v（闭音节弱阶）',
    basis: '芬兰语辅音阶变：强阶 p 在闭音节词中弱化为 v，如 tupan（属格）→ tuvan。',
    condition: '/p/ 所处重读音节的后续音节为闭音节时适用。',
    exception: '① 开音节保留强阶；② 叠辅音 pp 时长阶变与清化阶变冲突。',
    note: '在词末添加鼻音韵尾（如 -n）可构造闭音节环境。',
    examples: ['tupan', 'pata', 'uppu'],
    judge: (ctx) => {
      if (prevIs(ctx, 'p')) return { status: 'conflict', reason: '规则冲突：叠辅音 pp 处长辅音阶变（pp→p）与弱化阶变（p→v）竞争，停止推演。' }
      const closed = followingSyllableClosed(ctx.chars, ctx.index, uralVowels, uralCons)
      return closed
        ? { status: 'applied', reason: '后续音节闭，强阶 /p/ 弱化为 /v/。' }
        : { status: 'no_change', reason: '后续音节开，弱阶不触发，/p/ 保留强阶。' }
    },
  },
  {
    id: 'ural-td', from: 't', to: 'd',
    title: 't → d（闭音节弱阶）',
    basis: '芬兰语辅音阶变：强阶 t 在闭音节词中弱化为 d，如 katon → kadon。',
    condition: '/t/ 所处重读音节的后续音节为闭音节时适用。',
    exception: '① 开音节保留强阶；② 叠辅音 tt 时长阶变与清化阶变冲突。',
    note: '判定仅依据输入中的音节开闭结构。',
    examples: ['katon', 'kata', 'katto'],
    judge: (ctx) => {
      if (prevIs(ctx, 't')) return { status: 'conflict', reason: '规则冲突：叠辅音 tt 处长辅音阶变（tt→t）与弱化阶变（t→d）竞争，停止推演。' }
      const closed = followingSyllableClosed(ctx.chars, ctx.index, uralVowels, uralCons)
      return closed
        ? { status: 'applied', reason: '后续音节闭，强阶 /t/ 弱化为 /d/。' }
        : { status: 'no_change', reason: '后续音节开，弱阶不触发，/t/ 保留强阶。' }
    },
  },
]
const uralVowels = new Set(['a', 'e', 'i', 'o', 'u', 'ä', 'ö', 'y'])
const uralCons = new Set(['p', 't', 'k', 'm', 'n', 's', 'l', 'r', 'v', 'j', 'h'])

// ── 规则包 ───────────────────────────────────────────────────
export const RULE_PACKS: RulePack[] = [
  {
    familyId: 'ie', familyName: '印欧语系', scope: '原始印欧语 → 原始日耳曼语（Grimm 第一音变）', target: '日耳曼语族',
    cards: [
      { ruleId: 'ie-grimm-pf', example: 'pater', label: 'pater → father' },
      { ruleId: 'ie-grimm-tt', example: 'tres', label: 'tres → three' },
      { ruleId: 'ie-grimm-kh', example: 'cord', label: 'cord → heart' },
    ],
    normalize: (s) => stripAsterisk(s).replace(/c/g, 'k'),
    knownConsonants: ['p', 't', 'k', 'b', 'd', 'g', 'f', 'h', 's', 'm', 'n', 'l', 'r', 'w', 'j'],
    knownVowels: ['a', 'e', 'i', 'o', 'u', 'ā', 'ē', 'ī', 'ō', 'ū', 'á', 'é', 'í', 'ó', 'ú'],
    rules: iePRules,
  },
  {
    familyId: 'st', familyName: '汉藏语系', scope: '上古汉语 → 中古汉语（等韵门法）', target: '中古汉语',
    cards: [
      { ruleId: 'st-labial', example: 'pjang', label: 'pjang → 非母（轻唇化）' },
      { ruleId: 'st-retroflex', example: 'rta', label: 'rta → 知母（卷舌化）' },
    ],
    normalize: stripAsterisk,
    knownConsonants: ['p', 't', 'k', 'b', 'd', 'g', 'm', 'n', 's', 'h', 'r', 'l', 'j', 'y'],
    knownVowels: ['a', 'e', 'i', 'o', 'u'],
    rules: stRules,
  },
  {
    familyId: 'aa', familyName: '亚非语系', scope: '原始闪米特语 → 古典阿拉伯语', target: '阿拉伯语支',
    cards: [
      { ruleId: 'aa-pf', example: 'pana', label: '*p → f 音移' },
      { ruleId: 'aa-ss', example: 'šam', label: '*š → s 合流' },
    ],
    normalize: stripAsterisk,
    knownConsonants: ['p', 't', 'k', 'b', 'd', 'g', 'f', 'h', 's', 'š', 'm', 'n', 'l', 'r', 'w', 'y', 'ʔ'],
    knownVowels: ['a', 'i', 'u', 'ā', 'ī', 'ū'],
    rules: aaRules,
  },
  {
    familyId: 'ural', familyName: '乌拉尔语系', scope: '原始芬兰语 → 芬兰语（辅音阶变）', target: '芬兰语',
    cards: [
      { ruleId: 'ural-pv', example: 'tupan', label: 'tupan → tuvan' },
      { ruleId: 'ural-td', example: 'katon', label: 'katon → kadon' },
    ],
    normalize: stripAsterisk,
    knownConsonants: ['p', 't', 'k', 'm', 'n', 's', 'l', 'r', 'v', 'j', 'h'],
    knownVowels: ['a', 'e', 'i', 'o', 'u', 'ä', 'ö', 'y'],
    rules: uralRules,
  },
]

// ── 失败原因表 ───────────────────────────────────────────────
const FAIL_REASONS: Record<DeriveFailCode, string> = {
  EMPTY_INPUT: '空输入：未提供原始形式，推演在第 0 步停止。',
  UNKNOWN_PHONEME: '未知音变：该音位未登记在当前语系规则包中，无适用规则，推演停止。',
  RULE_BLOCKED: '规则阻断：命中已登记的例外边界，规则不得越过该边界继续。',
  RULE_CONFLICT: '规则冲突：同一位置存在竞争规则且证据不足，不得越过判定阈值给出结论。',
  FAMILY_MISMATCH: '语系校验失败：所选规则不属于当前语系规则包，已拒绝跨包套用。',
  EXPECTED_MISMATCH: '目标校验失败：推演输出与输入的现代词形不一致。',
}

// ── 推演引擎 ─────────────────────────────────────────────────
export function derive(
  pack: RulePack,
  ruleId: string,
  rawInput: string,
  rawExpected: string,
): DeriveResult {
  const base: Omit<DeriveResult, 'ok' | 'failCode' | 'failReason' | 'stoppedAtIndex' | 'steps' | 'output' | 'match'> = {
    expected: null, familyId: pack.familyId, ruleId, preNote: null,
  }
  const fail = (code: DeriveFailCode, steps: DeriveStep[], index: number | null, output: string | null, extra?: Partial<DeriveResult>): DeriveResult => ({
    ...base, ...extra, ok: false, failCode: code, failReason: FAIL_REASONS[code],
    stoppedAtIndex: index, steps, output, match: false,
  })

  const rule = pack.rules.find(r => r.id === ruleId)
  if (!rule) return fail('FAMILY_MISMATCH', [], null, null)

  const trimmed = rawInput.trim()
  if (trimmed === '') return fail('EMPTY_INPUT', [], null, null)

  const normalized = (pack.normalize ?? stripAsterisk)(trimmed)
  const preNote = pack.familyId === 'ie' && /c/.test(trimmed)
    ? '拼写归一：拉丁语拼写 c 按音位 /k/ 处理后再推演。'
    : null

  const vowels = new Set(pack.knownVowels)
  const cons = new Set(pack.knownConsonants)
  const chars = Array.from(normalized)
  const steps: DeriveStep[] = []

  let fatal: { code: DeriveFailCode; index: number } | null = null

  for (let i = 0; i < chars.length; i++) {
    const c = chars[i]
    const ctx: RuleContext = {
      raw: normalized, chars, index: i,
      prev: i > 0 ? chars[i - 1] : null,
      next: i < chars.length - 1 ? chars[i + 1] : null,
    }

    if (PUNCTS.has(c)) {
      steps.push({ index: i, char: c, kind: 'punct', status: 'skipped', output: c, ruleId: null, detail: '边界符号，原样保留，不参与音变。' })
      continue
    }
    if (MODIFIERS.has(c)) {
      steps.push({ index: i, char: c, kind: 'modifier', status: 'skipped', output: c, ruleId: null, detail: '附加符号（送气/圆唇/长音），原样保留，不参与音变。' })
      continue
    }
    if (isVowel(c, vowels)) {
      steps.push({ index: i, char: c, kind: 'vowel', status: 'skipped', output: c, ruleId: null, detail: '元音不在所选辅音音变作用域内，原样保留。' })
      continue
    }
    if (isConsonant(c, cons)) {
      if (c === rule.from) {
        const v = rule.judge(ctx)
        const st: DeriveStatus = v.status
        const step: DeriveStep = {
          index: i, char: c, kind: 'consonant', status: st,
          output: st === 'applied' ? rule.to : c, ruleId: rule.id, detail: v.reason,
        }
        steps.push(step)
        if (st === 'blocked') { fatal = { code: 'RULE_BLOCKED', index: i }; break }
        if (st === 'conflict') { fatal = { code: 'RULE_CONFLICT', index: i }; break }
      } else {
        steps.push({ index: i, char: c, kind: 'consonant', status: 'skipped', output: c, ruleId: null, detail: `辅音 /${c}/ 不在所选规则（${rule.from}→${rule.to}）作用域内，原样保留。` })
      }
      continue
    }
    // 未登记音位：未知音变，明确停止
    steps.push({ index: i, char: c, kind: 'consonant', status: 'blocked', output: c, ruleId: rule.id, detail: `音位 /${c}/ 未登记于“${pack.familyName}”规则包，无适用规则。` })
    fatal = { code: 'UNKNOWN_PHONEME', index: i }
    break
  }

  if (fatal) {
    return fail(fatal.code, steps, fatal.index, null, { preNote })
  }

  const output = steps.map(s => s.output).join('')
  const expectedNorm = rawExpected.trim() === '' ? null : (pack.normalize ?? stripAsterisk)(rawExpected.trim())

  if (expectedNorm !== null && expectedNorm !== output) {
    return fail('EXPECTED_MISMATCH', steps, null, output, {
      expected: rawExpected.trim(),
      preNote,
    })
  }

  const triggered = steps.some(s => s.status === 'applied')
  if (!triggered) {
    steps.forEach(s => { if (s.ruleId && s.status === 'no_change') s.detail += '（全程规则未触发：该词在当前规则下维持原形。）' })
  }

  return {
    ...base, ok: true, failCode: null, failReason: '', stoppedAtIndex: null,
    steps, output, expected: expectedNorm, match: expectedNorm === null ? true : expectedNorm === output, preNote,
  }
}
