import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const TRACKED_CODES = [
  'STRICT_READ_UNTRACKED',
  'REACTIVE_WRITE_IN_OWNED_SCOPE',
  'FLUSH_IN_EFFECT_CALLBACK',
  'UNCOMMITTED_INPUT_OVERWRITTEN',
]

const args = process.argv.slice(2)
const shouldWrite = args.includes('--write')
const targets = args.filter((arg) => !arg.startsWith('--'))
const vitestTargets = targets.length > 0 ? targets : ['src/']

const result = spawnSync('pnpm', ['exec', 'vitest', 'run', ...vitestTargets], {
  encoding: 'utf8',
  maxBuffer: 64 * 1024 * 1024,
  env: {
    ...process.env,
    SOLID_DIAGNOSTICS: '1',
  },
})

const combinedOutput = `${result.stdout ?? ''}\n${result.stderr ?? ''}`
const counts = Object.fromEntries(TRACKED_CODES.map((code) => [code, 0]))
const allCounts = {}
let total = 0

const FOOTER_PREFIXES = [
  'what it means and how to fix it:',
  'agent repair guide:',
  'deeper evidence:',
]

for (const line of combinedOutput.split('\n')) {
  const match = /^\[([A-Z][A-Z0-9_]+)\]\s+(.*)$/.exec(line.trim())
  if (!match) {
    continue
  }
  const [, code, message] = match
  if (FOOTER_PREFIXES.some((prefix) => message.startsWith(prefix))) {
    continue
  }
  total += 1
  allCounts[code] = (allCounts[code] ?? 0) + 1
  if (code in counts) {
    counts[code] += 1
  }
}

const sortedAll = Object.fromEntries(
  Object.entries(allCounts).toSorted((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])),
)

const summary = {
  total,
  tracked: counts,
  all: sortedAll,
}

process.stdout.write('\nSolid 2.0 Diagnostic Summary:\n')
process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`)

if (shouldWrite) {
  const baselinePath = path.resolve('test/solid-diagnostics-baseline.json')
  fs.writeFileSync(baselinePath, `${JSON.stringify(summary, null, 2)}\n`, 'utf8')
  process.stdout.write(`\nWrote baseline to ${baselinePath}\n`)
}

if (result.status !== 0) {
  const tail = combinedOutput.split('\n').slice(-40).join('\n')
  console.error(tail)
}

process.exit(result.status ?? 1)
