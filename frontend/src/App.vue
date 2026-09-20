<template>
  <div class="min-h-screen bg-slate-900 text-slate-200">
    <header class="border-b border-slate-700 px-6 py-4">
      <h1 class="text-2xl font-bold text-cyan-400">语言词源图谱与多语系演化追踪</h1>
      <p class="text-sm text-slate-500 mt-1">D3.js力导向图 · 印欧语系演化 · 同源词对照 · 500+词根</p>
    </header>
    <div class="p-4 space-y-4">
      <div class="grid lg:grid-cols-3 gap-4">
        <div class="lg:col-span-2 bg-slate-800 rounded-lg p-4 border border-slate-700">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-sm font-bold text-slate-400">词源力导向网络</h3>
            <div class="flex gap-3 text-xs">
              <span v-for="f in LANGUAGE_FAMILIES" :key="f.id" class="flex items-center gap-1">
                <span class="w-3 h-3 rounded-full" :style="{backgroundColor: f.color}"></span>{{ f.name }}
              </span>
            </div>
          </div>
          <svg ref="svgRef" class="w-full bg-slate-900 rounded" style="height:460px"></svg>
        </div>
        <div class="space-y-4">
          <div class="bg-slate-800 rounded-lg p-4 border border-slate-700">
            <h3 class="text-sm font-bold text-slate-400 mb-3">语系概览</h3>
            <div class="space-y-2">
              <div v-for="f in LANGUAGE_FAMILIES" :key="f.id" class="flex items-start gap-2 text-sm">
                <span class="w-3 h-3 rounded-full mt-0.5 flex-shrink-0" :style="{backgroundColor: f.color}"></span>
                <div><div class="font-bold">{{ f.name }}</div><div class="text-xs text-slate-500">{{ f.era }} · {{ f.languages.join('/') }}</div></div>
              </div>
            </div>
          </div>
          <div v-if="store.selectedNode" class="bg-slate-800 rounded-lg p-4 border border-slate-700">
            <h3 class="text-sm font-bold text-slate-400 mb-2">选中节点</h3>
            <div class="text-lg font-bold text-cyan-400">{{ store.selectedNode.word }}</div>
            <div class="text-sm text-slate-400">{{ store.selectedNode.language }} — {{ store.selectedNode.meaning }}</div>
          </div>
          <div class="bg-slate-800 rounded-lg p-4 border border-slate-700 text-xs text-slate-400">
            <h3 class="text-sm font-bold text-slate-400 mb-2">Grimm定律</h3>
            <div class="space-y-1">
              <div class="bg-slate-900 rounded p-2"><span class="text-cyan-400">p→f: </span>pater → father</div>
              <div class="bg-slate-900 rounded p-2"><span class="text-green-400">t→θ: </span>tres → three</div>
              <div class="bg-slate-900 rounded p-2"><span class="text-orange-400">k→h: </span>cord → heart</div>
            </div>
          </div>
        </div>
      </div>
      <div class="bg-slate-800 rounded-lg p-4 border border-slate-700">
        <h3 class="text-sm font-bold text-slate-400 mb-3">同源词对照表</h3>
        <div class="flex gap-2 mb-3">
          <input v-model="store.searchQuery" placeholder="搜索词根/含义..." class="flex-1 bg-slate-900 border border-slate-600 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-cyan-500" />
          <select v-model="store.selectedFamily" class="bg-slate-900 border border-slate-600 rounded px-2 text-sm text-slate-300">
            <option value="all">全部语系</option>
            <option v-for="f in LANGUAGE_FAMILIES" :key="f.id" :value="f.id">{{ f.name }}</option>
          </select>
        </div>
        <div class="overflow-x-auto max-h-64 overflow-y-auto">
          <table class="w-full text-xs">
            <thead class="sticky top-0 bg-slate-700">
              <tr>
                <th class="px-2 py-2 text-left text-slate-300">词根</th>
                <th class="px-2 py-2 text-left text-slate-300">含义</th>
                <th class="px-2 py-2 text-left text-cyan-400">英语</th>
                <th class="px-2 py-2 text-left text-blue-400">法语</th>
                <th class="px-2 py-2 text-left text-green-400">德语</th>
                <th class="px-2 py-2 text-left text-orange-400">西班牙语</th>
                <th class="px-2 py-2 text-left text-purple-400">俄语</th>
                <th class="px-2 py-2 text-left text-yellow-400">拉丁语</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="cs in store.filteredCognates" :key="cs.root" class="border-t border-slate-700 hover:bg-slate-700">
                <td class="px-2 py-1.5 font-mono text-slate-200 font-bold">{{ cs.root }}</td>
                <td class="px-2 py-1.5 text-slate-400">{{ cs.meaning }}</td>
                <td class="px-2 py-1.5 font-mono text-cyan-300">{{ cs.languages['英语'] || '—' }}</td>
                <td class="px-2 py-1.5 font-mono text-blue-300">{{ cs.languages['法语'] || '—' }}</td>
                <td class="px-2 py-1.5 font-mono text-green-300">{{ cs.languages['德语'] || '—' }}</td>
                <td class="px-2 py-1.5 font-mono text-orange-300">{{ cs.languages['西班牙语'] || '—' }}</td>
                <td class="px-2 py-1.5 font-mono text-purple-300">{{ cs.languages['俄语'] || '—' }}</td>
                <td class="px-2 py-1.5 font-mono text-yellow-300">{{ cs.languages['拉丁语'] || '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 音变规则推演 -->
      <div class="bg-slate-800 rounded-lg p-4 border border-slate-700">
        <div class="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h3 class="text-sm font-bold text-slate-400">音变规则推演</h3>
          <span class="text-xs text-slate-500">逐步展示推导依据 · 适用条件 · 例外边界 | 切换语系后按各语系规则包重新校验</span>
        </div>

        <!-- 控制区 -->
        <div class="grid md:grid-cols-4 gap-2 mb-3">
          <div>
            <label class="block text-xs text-slate-500 mb-1">语系（规则包）</label>
            <select v-model="deriveFamilyId" class="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1.5 text-sm text-slate-300">
              <option v-for="p in RULE_PACKS" :key="p.familyId" :value="p.familyId">{{ p.familyName }}</option>
            </select>
          </div>
          <div class="md:col-span-2">
            <label class="block text-xs text-slate-500 mb-1">辅音变化规则组</label>
            <select v-model="deriveRuleId" class="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1.5 text-sm text-slate-300">
              <option v-for="r in currentPack.rules" :key="r.id" :value="r.id">{{ r.title }}</option>
            </select>
          </div>
          <div>
            <label class="block text-xs text-slate-500 mb-1">推演方向</label>
            <div class="bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-400 h-[38px] flex items-center">
              {{ currentPack.scope }}
            </div>
          </div>
        </div>

        <!-- 规则元信息（只读） -->
        <div class="grid md:grid-cols-3 gap-2 mb-3 text-xs">
          <div class="bg-slate-900 rounded p-2 border border-slate-700">
            <div class="text-cyan-400 font-bold mb-1">推导依据</div>
            <div class="text-slate-400 leading-relaxed">{{ currentRule.basis }}</div>
          </div>
          <div class="bg-slate-900 rounded p-2 border border-slate-700">
            <div class="text-green-400 font-bold mb-1">适用条件</div>
            <div class="text-slate-400 leading-relaxed">{{ currentRule.condition }}</div>
          </div>
          <div class="bg-slate-900 rounded p-2 border border-slate-700">
            <div class="text-red-400 font-bold mb-1">例外边界</div>
            <div class="text-slate-400 leading-relaxed">{{ currentRule.exception }}</div>
          </div>
        </div>

        <!-- 输入区 -->
        <div class="flex flex-wrap gap-2 items-center mb-2">
          <input
            v-model="deriveInput"
            :placeholder="`输入原始形式（目标语支：${currentPack.target}）`"
            class="w-56 bg-slate-900 border border-slate-600 rounded px-3 py-1.5 text-sm font-mono focus:outline-none focus:border-cyan-500"
            @keyup.enter="runDerive"
          />
          <input
            v-model="deriveExpected"
            placeholder="现代词形（可选，用于校验）"
            class="w-52 bg-slate-900 border border-slate-600 rounded px-3 py-1.5 text-sm font-mono focus:outline-none focus:border-cyan-500"
            @keyup.enter="runDerive"
          />
          <button @click="runDerive" class="bg-cyan-700 hover:bg-cyan-600 text-white text-sm rounded px-4 py-1.5">开始推演</button>
          <div class="flex gap-1 flex-wrap items-center">
            <span class="text-xs text-slate-500">示例：</span>
            <button
              v-for="ex in currentRule.examples" :key="ex"
              @click="pickExample(ex)"
              class="text-xs font-mono bg-slate-700 hover:bg-slate-600 rounded px-2 py-1 text-slate-200"
            >{{ ex }}</button>
          </div>
        </div>
        <p class="text-xs text-slate-500 mb-3">{{ currentRule.note }}</p>

        <!-- 结果区 -->
        <div v-if="deriveResult" class="border-t border-slate-700 pt-3">
          <div v-if="deriveResult.preNote" class="mb-2 text-xs bg-cyan-950 border border-cyan-800 text-cyan-300 rounded px-3 py-1.5">
            前置处理：{{ deriveResult.preNote }}
          </div>

          <!-- 失败 / 停止 -->
          <div v-if="!deriveResult.ok" class="mb-3 rounded border px-3 py-2 bg-red-950 border-red-800">
            <div class="flex items-center gap-2 text-sm font-bold text-red-300">
              <span>■ 推演已停止</span>
              <span class="text-xs font-mono bg-red-900 rounded px-1.5 py-0.5">{{ deriveResult.failCode }}</span>
              <span v-if="deriveResult.stoppedAtIndex !== null" class="text-xs text-red-400">
                停止位置：归一化输入第 {{ deriveResult.stoppedAtIndex + 1 }} 位
              </span>
            </div>
            <div class="text-xs text-red-300 mt-1">{{ deriveResult.failReason }}</div>
          </div>

          <!-- 成功但目标不匹配（EXPECTED_MISMATCH 走失败分支） -->
          <div v-else-if="deriveResult.match" class="mb-3 rounded border px-3 py-2 bg-green-950 border-green-800">
            <div class="text-sm font-bold text-green-300">✓ 推演完成{{ deriveResult.expected !== null ? '，现代词形校验一致' : '' }}</div>
            <div class="text-xs text-green-400/80 mt-0.5">
              输出：<span class="font-mono font-bold">{{ deriveResult.output }}</span>
              <span v-if="deriveResult.expected !== null">＝ 预期 <span class="font-mono">{{ deriveResult.expected }}</span></span>
            </div>
          </div>

          <!-- 规则步骤列表 -->
          <div class="text-xs text-slate-500 mb-1">规则步骤列表（{{ deriveResult.steps.length }} 步）：</div>
          <ol class="space-y-1">
            <li
              v-for="s in deriveResult.steps" :key="s.index"
              class="flex items-start gap-2 bg-slate-900 rounded px-2 py-1.5 border"
              :class="s.status === 'applied' ? 'border-green-800' : s.status === 'blocked' ? 'border-red-800' : s.status === 'conflict' ? 'border-amber-700' : 'border-slate-700'"
            >
              <span class="font-mono text-slate-500 w-10 flex-shrink-0">第{{ s.index + 1 }}位</span>
              <span class="font-mono text-base leading-5 w-6 text-center flex-shrink-0 text-slate-100">{{ s.char }}</span>
              <span class="text-[10px] rounded px-1 py-0.5 border flex-shrink-0 mt-0.5" :class="STATUS_META[s.status].cls">{{ STATUS_META[s.status].label }}</span>
              <span class="text-[10px] rounded px-1 py-0.5 bg-slate-800 text-slate-500 border border-slate-700 flex-shrink-0 mt-0.5">{{ KIND_LABELS[s.kind] }}</span>
              <span class="text-slate-400 flex-1">{{ s.detail }}</span>
              <span v-if="s.status === 'applied'" class="font-mono text-green-300 flex-shrink-0">{{ s.char }} → {{ s.output }}</span>
            </li>
          </ol>

          <!-- 被阻断后未执行位置的说明 -->
          <div v-if="!deriveResult.ok && deriveResult.stoppedAtIndex !== null" class="text-xs text-slate-500 mt-2">
            判定阈值：遇未知音位 / 例外边界 / 规则冲突即停止，其后音位不再推演，不给出结论。
          </div>
        </div>

        <div v-else class="border-t border-slate-700 pt-3 text-xs text-slate-500">
          选择规则组与示例词（或输入原始形式，可附现代词形作校验），点击“开始推演”查看逐步推导。
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import * as d3 from 'd3'
import { useEtymologyStore, LANGUAGE_FAMILIES } from './store/etymology'
import { RULE_PACKS, derive } from './lib/soundChange'
import type { DeriveResult, DeriveStatus } from './types'

const store = useEtymologyStore()
const svgRef = ref<SVGSVGElement | null>(null)
const COLORS: Record<string, string> = { ie: '#3b82f6', st: '#22c55e', aa: '#f59e0b', ural: '#8b5cf6' }

// ── 音变规则推演状态 ──
const deriveFamilyId = ref('ie')
const deriveRuleId = ref(RULE_PACKS[0].rules[0].id)
const deriveInput = ref('')
const deriveExpected = ref('')
const deriveResult = ref<DeriveResult | null>(null)

const currentPack = computed(() => RULE_PACKS.find(p => p.familyId === deriveFamilyId.value) ?? RULE_PACKS[0])
const currentRule = computed(() => currentPack.value.rules.find(r => r.id === deriveRuleId.value) ?? currentPack.value.rules[0])

// 切换语系：各自规则包分别校验，规则不属于该包时重置为该包首条规则，旧结论作废
watch(deriveFamilyId, (id) => {
  const pack = RULE_PACKS.find(p => p.familyId === id)
  if (pack && !pack.rules.some(r => r.id === deriveRuleId.value)) {
    deriveRuleId.value = pack.rules[0].id
  }
  deriveResult.value = null
})
watch(deriveRuleId, () => { deriveResult.value = null })

function pickExample(ex: string) {
  deriveInput.value = ex
  deriveResult.value = null
}

function runDerive() {
  deriveResult.value = derive(currentPack.value, deriveRuleId.value, deriveInput.value, deriveExpected.value)
}

const STATUS_META: Record<DeriveStatus, { label: string; cls: string }> = {
  applied: { label: '已适用', cls: 'text-green-300 border-green-700 bg-green-950' },
  no_change: { label: '条件不满足', cls: 'text-slate-300 border-slate-600 bg-slate-800' },
  skipped: { label: '跳过', cls: 'text-slate-400 border-slate-700 bg-slate-800' },
  blocked: { label: '阻断', cls: 'text-red-300 border-red-700 bg-red-950' },
  conflict: { label: '规则冲突', cls: 'text-amber-300 border-amber-700 bg-amber-950' },
}
const KIND_LABELS: Record<string, string> = {
  consonant: '辅音', vowel: '元音', punct: '边界符', modifier: '附加符',
}

function drawGraph() {
  if (!svgRef.value) return
  const svg = d3.select(svgRef.value)
  svg.selectAll('*').remove()
  const W = svgRef.value.getBoundingClientRect().width || 700, H = 460
  const nodes = store.graph.nodes.map((n: any) => ({ ...n }))
  const links = store.graph.links.map((l: any) => ({ ...l }))
  const sim = d3.forceSimulation(nodes as any)
    .force('link', d3.forceLink(links as any).id((d: any) => d.id).distance(55))
    .force('charge', d3.forceManyBody().strength(-100))
    .force('center', d3.forceCenter(W / 2, H / 2))
    .force('collision', d3.forceCollide(22))
  const g = svg.append('g')
  svg.call(d3.zoom<SVGSVGElement, unknown>().scaleExtent([0.2, 3]).on('zoom', (e) => g.attr('transform', e.transform)) as any)
  const link = g.append('g').selectAll('line').data(links).join('line')
    .attr('stroke', '#475569').attr('stroke-width', 1).attr('opacity', 0.5)
  const node = g.append('g').selectAll('g').data(nodes).join('g')
    .call(d3.drag<any, any>()
      .on('start', (e, d: any) => { if (!e.active) sim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y })
      .on('drag', (e, d: any) => { d.fx = e.x; d.fy = e.y })
      .on('end', (e, d: any) => { if (!e.active) sim.alphaTarget(0); d.fx = null; d.fy = null }))
    .on('click', (_: any, d: any) => { store.selectedNode = d })
  node.append('circle')
    .attr('r', (d: any) => d.language === 'Proto-IE' ? 12 : 7)
    .attr('fill', (d: any) => COLORS[d.family] || '#64748b')
    .attr('stroke', '#1e293b').attr('stroke-width', 1.5)
  node.append('text').attr('dy', -14).attr('text-anchor', 'middle').attr('font-size', 9).attr('fill', '#e2e8f0')
    .text((d: any) => d.word.length > 8 ? d.word.slice(0, 8) + '…' : d.word)
  node.append('title').text((d: any) => `${d.word} (${d.language}): ${d.meaning}`)
  sim.on('tick', () => {
    link.attr('x1', (d: any) => d.source.x).attr('y1', (d: any) => d.source.y)
      .attr('x2', (d: any) => d.target.x).attr('y2', (d: any) => d.target.y)
    node.attr('transform', (d: any) => `translate(${d.x},${d.y})`)
  })
}

onMounted(() => { setTimeout(drawGraph, 100) })
</script>
