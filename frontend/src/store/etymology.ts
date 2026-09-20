import { defineStore } from 'pinia'
import { ref, computed, watch, nextTick } from 'vue'
import { COGNATE_SETS, LANGUAGE_FAMILIES, buildGraph } from '../mock/data'
import { SOUND_CHANGE_RULES, VERIFIED_CONCLUSIONS, deriveSoundChange } from '../mock/soundchange'
import type { DerivationResult } from '../types'
export { LANGUAGE_FAMILIES, COGNATE_SETS, SOUND_CHANGE_RULES, VERIFIED_CONCLUSIONS }

export const useEtymologyStore = defineStore('etymology', () => {
  const graph = ref(buildGraph())
  const selectedNode = ref<any>(null)
  const searchQuery = ref('')
  const selectedFamily = ref('all')

  const filteredCognates = computed(() =>
    COGNATE_SETS.filter(cs => {
      const q = searchQuery.value.toLowerCase()
      const matchSearch = !q || cs.root.toLowerCase().includes(q) || cs.meaning.includes(q) || Object.values(cs.languages).some((w: string) => w.toLowerCase().includes(q))
      const matchFamily = selectedFamily.value === 'all' || cs.family === selectedFamily.value
      return matchSearch && matchFamily
    })
  )

  // 音变规则推演
  const derivationFamily = ref('ie')
  const selectedRuleId = ref('')
  const wordInput = ref('')
  const derivationResult = ref<DerivationResult | null>(null)

  const currentRule = computed(() => SOUND_CHANGE_RULES.find(r => r.id === selectedRuleId.value) || null)

  // 切换语系时重置推演状态，各语系规则分别校验
  watch(derivationFamily, () => {
    selectedRuleId.value = ''
    wordInput.value = ''
    derivationResult.value = null
  })

  function runDerivation() {
    derivationResult.value = deriveSoundChange(selectedRuleId.value, derivationFamily.value, wordInput.value)
  }

  async function loadVerified(v: { ruleId: string; proto: string }) {
    derivationFamily.value = 'ie'
    await nextTick() // 等待语系切换的重置 watcher 执行完毕
    selectedRuleId.value = v.ruleId
    wordInput.value = v.proto
    runDerivation()
  }

  return {
    graph, selectedNode, searchQuery, selectedFamily, filteredCognates,
    derivationFamily, selectedRuleId, wordInput, derivationResult, currentRule,
    runDerivation, loadVerified,
  }
})
