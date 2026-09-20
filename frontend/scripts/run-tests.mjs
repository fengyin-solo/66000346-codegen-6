// 跨平台测试运行器：经 esbuild JS API 打包 sc-test.ts（规避 CLI 原生二进制差异）
import { build } from 'esbuild'
import { pathToFileURL } from 'node:url'
import { rmSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const out = join(root, '.test-bundle.mjs')

process.on('exit', () => rmSync(out, { force: true }))

await build({
  entryPoints: [join(root, 'sc-test.ts')],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: out,
  absWorkingDir: root,
  logLevel: 'warning',
})

await import(pathToFileURL(out).href)
