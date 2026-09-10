// @vitest-environment node

import { execFileSync, spawnSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { expect, test } from 'vitest'

import { createIsolatedConsumer, PROJECT_ROOT, removeIsolatedConsumer } from './helpers'

test('publishes only documented entry points with types before runtime conditions', () => {
  const consumer = createIsolatedConsumer({ virtualizer: false })
  try {
    const manifest = JSON.parse(readFileSync(join(consumer.packageDir, 'package.json'), 'utf8'))
    expect(Object.keys(manifest.exports).sort()).toEqual([
      '.',
      './icon.css',
      './package.json',
      './tailwind',
      './theme',
      './unocss',
      './utils',
      './virtualizer',
    ])
    for (const [name, target] of Object.entries(manifest.exports)) {
      if (typeof target === 'string') {
        expect(existsSync(join(consumer.packageDir, target)), name).toBe(true)
        continue
      }
      const conditions = target as Record<string, string>
      expect(Object.keys(conditions)).toEqual(
        ['.', './utils', './virtualizer'].includes(name)
          ? ['types', 'solid', 'default']
          : ['types', 'default'],
      )
      for (const file of Object.values(conditions)) {
        expect(existsSync(join(consumer.packageDir, file)), file).toBe(true)
      }
    }
    const entry = join(consumer.root, 'verify.mjs')
    writeFileSync(
      entry,
      `
      import assert from 'node:assert/strict'
      import { useDisclosureState } from 'moraine/utils'
      assert.equal(typeof useDisclosureState, 'function')
      assert.ok(import.meta.resolve('moraine').endsWith('/dist/index.mjs'))
      for (const specifier of ['moraine/button', 'moraine/dist/index.mjs', 'moraine/shared/provider']) {
        assert.throws(() => import.meta.resolve(specifier), { code: 'ERR_PACKAGE_PATH_NOT_EXPORTED' })
      }
    `,
    )
    execFileSync('nub', ['--node', entry], { cwd: consumer.root, stdio: 'pipe' })
  } finally {
    removeIsolatedConsumer(consumer)
  }
})

test.each(['Bundler', 'NodeNext'] as const)(
  'resolves %s declarations without the virtualizer peer',
  (moduleResolution) => {
    const consumer = createIsolatedConsumer({ virtualizer: false })
    try {
      writeFileSync(join(consumer.root, 'package.json'), JSON.stringify({ type: 'module' }))
      writeFileSync(
        join(consumer.root, 'entry.tsx'),
        `
      import { Button, Dialog, Select } from 'moraine'
      import type { FormT, ListT } from 'moraine'
      import { createContextProvider, useDisclosureState } from 'moraine/utils'
      import { createTheme } from 'moraine/theme'
      export { createContextProvider, useDisclosureState, createTheme }
      export const mode: FormT.ValidationMode = 'blur'
      export const row: ListT.RowProps<HTMLLIElement> = { 'data-index': 0 }
      export const button = <Button as="a" href="/">Save</Button>
      export const dialog = <Dialog><Dialog.Trigger>Open</Dialog.Trigger><Dialog.Content /></Dialog>
      export const select = <Select options={[{ value: 1, label: 'One' }]} onChange={value => value?.toFixed()} />
      // @ts-expect-error Component-specific subpaths are not public.
      type ButtonPath = typeof import('moraine/button')
      // @ts-expect-error Internal helpers are not public components.
      type AvatarFace = typeof import('moraine').AvatarFace
      // @ts-expect-error Internal keyboard normalization is not public.
      type KeyAliases = typeof import('moraine').KBD_KEY_ALIASES
      // @ts-expect-error Internal slider behavior is not public.
      type SliderHook = typeof import('moraine').useSlider
      // @ts-expect-error Internal slider return types are not public.
      type SliderReturn = import('moraine').UseSliderReturn
      // @ts-expect-error The virtualizer has its own optional entry.
      type UtilsVirtualizer = typeof import('moraine/utils').useListVirtualizer
    `,
      )
      const config = join(consumer.root, 'tsconfig.json')
      writeFileSync(
        config,
        JSON.stringify({
          compilerOptions: {
            strict: true,
            noEmit: true,
            skipLibCheck: false,
            target: 'ESNext',
            module: moduleResolution === 'Bundler' ? 'ESNext' : 'NodeNext',
            moduleResolution,
            customConditions: ['solid'],
            jsx: 'preserve',
            jsxImportSource: 'solid-js',
          },
          files: ['./entry.tsx'],
        }),
      )
      const result = spawnSync('nubx', ['tsc', '-p', config], {
        cwd: PROJECT_ROOT,
        encoding: 'utf8',
      })
      expect(result.status, result.stdout + result.stderr).toBe(0)
    } finally {
      removeIsolatedConsumer(consumer)
    }
  },
)
