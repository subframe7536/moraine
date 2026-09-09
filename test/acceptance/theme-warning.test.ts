// @vitest-environment node

import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'

import { expect, test } from 'vitest'

const source = `
import { createRoot } from 'solid-js'
import { useThemeLayers } from './src/shared/provider/theme-context.tsx'
let warnings = 0
console.warn = () => warnings++
createRoot(dispose => { useThemeLayers(); useThemeLayers(); dispose() })
createRoot(dispose => { useThemeLayers(); useThemeLayers(); dispose() })
useThemeLayers(); useThemeLayers()
console.log(warnings)
`

test.each([
  ['development', true, '3'],
  ['test', true, '0'],
  ['production', false, '0'],
] as const)('missing Provider warning in %s', (mode, development, expected) => {
  const output = execFileSync(
    'nub',
    [
      '--conditions=browser',
      ...(development ? ['--conditions=development'] : []),
      '--input-type=module',
    ],
    {
      cwd: resolve(import.meta.dirname, '../..'),
      input: source,
      encoding: 'utf8',
      env: { ...process.env, NODE_ENV: mode },
    },
  )
  expect(output.trim()).toBe(expected)
})
