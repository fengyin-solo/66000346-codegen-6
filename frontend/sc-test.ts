import { RULE_PACKS, derive } from './src/lib/soundChange'

const pack = (id: string) => RULE_PACKS.find(p => p.familyId === id)!
let pass = 0, fail = 0
function t(name: string, cond: boolean, extra = '') {
  if (cond) { pass++; console.log('PASS', name) }
  else { fail++; console.log('FAIL', name, extra) }
}

// IE p→f: pater -> fater
let r = derive(pack('ie'), 'ie-grimm-pf', 'pater', '')
t('ie pater applied', r.ok && r.output === 'fater' && r.steps.some(s=>s.status==='applied'), JSON.stringify(r))

// IE p→f: spes 命中 sp 阻断
r = derive(pack('ie'), 'ie-grimm-pf', 'spes', '')
t('ie spes blocked', !r.ok && r.failCode === 'RULE_BLOCKED' && r.stoppedAtIndex === 1, `code=${r.failCode}`)

// IE t→θ: tres -> θres
r = derive(pack('ie'), 'ie-grimm-tt', 'tres', '')
t('ie tres->θres', r.ok && r.output === 'θres', r.output ?? '')

// IE t→θ: status -> sθatus? status = s t a t u s: 第一个 t 被 s 前导 → blocked
r = derive(pack('ie'), 'ie-grimm-tt', 'status', '')
t('ie status blocked at /st/', !r.ok && r.failCode === 'RULE_BLOCKED' && r.stoppedAtIndex === 1)

// IE t→θ: patér Verner 冲突
r = derive(pack('ie'), 'ie-grimm-tt', 'patér', '')
t('ie patér conflict', !r.ok && r.failCode === 'RULE_CONFLICT' && r.stoppedAtIndex === 2)

// IE k→h: cord 拼写归一 c→k, 输出 hord
r = derive(pack('ie'), 'ie-grimm-kh', 'cord', '')
t('ie cord->hord with normalize', r.ok && r.output === 'hord' && r.preNote !== null)

// IE k→h: kwesti -> hwesti (kw 环境非 sk)
r = derive(pack('ie'), 'ie-grimm-kh', 'kwesti', '')
t('ie kwesti->hwesti', r.ok && r.output === 'hwesti', r.output ?? '')

// IE 未知音位 θ
r = derive(pack('ie'), 'ie-grimm-pf', 'θa', '')
t('ie unknown θ stops', !r.ok && r.failCode === 'UNKNOWN_PHONEME' && r.stoppedAtIndex === 0)

// IE 空输入
r = derive(pack('ie'), 'ie-grimm-pf', '   ', '')
t('ie empty input', !r.ok && r.failCode === 'EMPTY_INPUT')

// 星号去除 *pater
r = derive(pack('ie'), 'ie-grimm-pf', '*pater', '')
t('ie *pater stripped', r.ok && r.output === 'fater')

// 目标校验一致
r = derive(pack('ie'), 'ie-grimm-pf', 'pater', 'fater')
t('ie expected match', r.ok && r.match === true)

// 目标校验不一致
r = derive(pack('ie'), 'ie-grimm-pf', 'pater', 'father')
t('ie expected mismatch', !r.ok && r.failCode === 'EXPECTED_MISMATCH' && r.output === 'fater')

// ST p→f: pjang -> fjang
r = derive(pack('st'), 'st-labial', 'pjang', '')
t('st pjang->fjang', r.ok && r.output === 'fjang', r.output ?? '')

// ST p→f: pang 条件不触发，输出 pang, ok
r = derive(pack('st'), 'st-labial', 'pang', '')
t('st pang no_change', r.ok && r.output === 'pang' && !r.steps.some(s=>s.status==='applied'))

// ST p→f: pʷang 阻断
r = derive(pack('st'), 'st-labial', 'pʷang', '')
t('st pʷang blocked', !r.ok && r.failCode === 'RULE_BLOCKED')

// ST 切语系后 IE 规则跨包失败
r = derive(pack('st'), 'ie-grimm-pf', 'pater', '')
t('cross-family rule rejected', !r.ok && r.failCode === 'FAMILY_MISMATCH')

// ST rta -> rʈa
r = derive(pack('st'), 'st-retroflex', 'rta', '')
t('st rta->rʈa', r.ok && r.output === 'rʈa', r.output ?? '')

// AA pana -> fana
r = derive(pack('aa'), 'aa-pf', 'pana', '')
t('aa pana->fana', r.ok && r.output === 'fana', r.output ?? '')

// AA uppu 叠音冲突
r = derive(pack('aa'), 'aa-pf', 'uppu', '')
t('aa uppu conflict', !r.ok && r.failCode === 'RULE_CONFLICT' && r.stoppedAtIndex === 2)

// AA šam -> sam
r = derive(pack('aa'), 'aa-ss', 'šam', '')
t('aa šam->sam', r.ok && r.output === 'sam', r.output ?? '')

// Uralic tupan -> tuvan
r = derive(pack('ural'), 'ural-pv', 'tupan', '')
t('ural tupan->tuvan', r.ok && r.output === 'tuvan', r.output ?? '')

// Uralic pata 开音节不触发
r = derive(pack('ural'), 'ural-pv', 'pata', '')
t('ural pata open syllable no change', r.ok && r.output === 'pata', r.output ?? '')

// Uralic uppu 叠音冲突
r = derive(pack('ural'), 'ural-pv', 'uppu', '')
t('ural uppu conflict', !r.ok && r.failCode === 'RULE_CONFLICT')

// Uralic katon -> kadon
r = derive(pack('ural'), 'ural-td', 'katon', '')
t('ural katon->kadon', r.ok && r.output === 'kadon', r.output ?? '')

// Uralic kata 开音节
r = derive(pack('ural'), 'ural-td', 'kata', '')
t('ural kata open', r.ok && r.output === 'kata')

// Uralic katto 叠音冲突
r = derive(pack('ural'), 'ural-td', 'katto', '')
t('ural katto conflict', !r.ok && r.failCode === 'RULE_CONFLICT' && r.stoppedAtIndex === 3)

// 阻断后后续音位不产生 steps
r = derive(pack('ie'), 'ie-grimm-tt', 'status', '')
t('blocked stops remaining steps', r.steps.length === 2, `len=${r.steps.length}`)

// 未知音变后输出 null
r = derive(pack('ie'), 'ie-grimm-pf', 'θa', '')
t('unknown yields null output', r.output === null)

console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail ? 1 : 0)
