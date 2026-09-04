// @vitest-environment jsdom

import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'

import { describe, expect, test } from 'vitest'

import * as elements from '../../src/elements/index.ts'
import * as forms from '../../src/forms/index.ts'
import * as navigation from '../../src/navigation/index.ts'
import * as overlays from '../../src/overlays/index.ts'
import { resolveComponentStyle } from '../../src/shared/provider/moraine-provider.tsx'
import { recipe } from '../../src/shared/style/recipe.ts'

const PROJECT_ROOT = resolve(import.meta.dirname, '../..')

function readProjectFile(path: string): string {
  return readFileSync(join(PROJECT_ROOT, path), 'utf8')
}

function listProjectFiles(directory: string, extensions: readonly string[]): string[] {
  const absoluteDirectory = join(PROJECT_ROOT, directory)
  const files: string[] = []

  function visit(currentDirectory: string): void {
    for (const entry of readdirSync(currentDirectory, { withFileTypes: true })) {
      const path = join(currentDirectory, entry.name)
      if (entry.isDirectory()) {
        visit(path)
      } else if (extensions.some((extension) => entry.name.endsWith(extension))) {
        files.push(path)
      }
    }
  }

  visit(absoluteDirectory)
  return files.sort()
}

function projectRelative(path: string): string {
  return relative(PROJECT_ROOT, path).replaceAll('\\', '/')
}

function findSourceViolations(
  files: readonly string[],
  rules: readonly { label: string; pattern: RegExp }[],
): string[] {
  const violations: string[] = []

  for (const path of files) {
    const lines = readFileSync(path, 'utf8').split('\n')
    for (const [lineNumber, line] of lines.entries()) {
      for (const rule of rules) {
        if (rule.pattern.test(line)) {
          violations.push(
            `${projectRelative(path)}:${lineNumber + 1} ${rule.label}: ${line.trim()}`,
          )
        }
      }
    }
  }

  return violations
}

const sourceFiles = listProjectFiles('src', ['.ts', '.tsx'])
const sourceTokenRules = [
  { label: 'effect-*', pattern: /(?:^|[\s'"`])(?:[a-z0-9-]+:)?effect-[^\s'"`]+/i },
  { label: 'surface-overlay', pattern: /\bsurface-overlay\b/i },
  { label: 'hidden-hitless', pattern: /\bhidden-hitless\b/i },
  { label: 'style-*', pattern: /(?:^|[\s'"`])(?:[a-z0-9-]+:)?style-[^\s'"`]+/i },
  { label: 'rm-side-b', pattern: /\brm-side-b\b/i },
  { label: 'b-1', pattern: /\bb-1\b/i },
  { label: 'b-[trblxy]', pattern: /\bb-[trblxy]\b/i },
  { label: 'content-empty', pattern: /\bcontent-empty\b/i },
  { label: 'not-dark:', pattern: /\bnot-dark:/i },
  { label: 'not-last:', pattern: /\bnot-last:/i },
  { label: 'not-first-of-type:', pattern: /\bnot-first-of-type:/i },
  { label: '$ metric utility', pattern: /(?:^|[\s'"`])(?:[a-z0-9-]+:)?\$(?:mo|p|st|s)-[^\s'"`]+/i },
  { label: 'var-(slider|stepper|progress)', pattern: /\bvar-(?:slider|stepper|progress)-/i },
  { label: 'ring-3px', pattern: /\bring-3px\b/i },
  {
    label: 'semantic animation shortcut',
    pattern: /\banimate-(?:overlay|popup|menu|popover|tooltip|sheet)-(?:in|out|side-)[^\s'"`)]+/i,
  },
  { label: 'parenthesized variant group', pattern: /['"`][^'"`]*\w+:\([^)]+\)/ },
] as const

const standaloneProviderKeys: Record<string, string> = {
  Accordion: 'accordion',
  Avatar: 'avatar',
  AvatarGroup: 'avatarGroup',
  Badge: 'badge',
  Breadcrumb: 'breadcrumb',
  Button: 'button',
  ButtonGroup: 'buttonGroup',
  Card: 'card',
  Checkbox: 'checkbox',
  CheckboxGroup: 'checkboxGroup',
  CommandPalette: 'commandPalette',
  ContextMenu: 'contextMenu',
  Dialog: 'dialog',
  DropdownMenu: 'dropdownMenu',
  FileUpload: 'fileUpload',
  Form: 'form',
  FormField: 'formField',
  Icon: 'icon',
  Input: 'input',
  InputNumber: 'inputNumber',
  Kbd: 'kbd',
  KbdGroup: 'kbdGroup',
  List: 'list',
  MultiSelect: 'multiSelect',
  Pagination: 'pagination',
  Popover: 'popover',
  Progress: 'progress',
  RadioGroup: 'radioGroup',
  Resizable: 'resizable',
  Select: 'select',
  Separator: 'separator',
  Sheet: 'sheet',
  SidebarFrame: 'sidebarFrame',
  Slider: 'slider',
  Stepper: 'stepper',
  Switch: 'switch',
  Tabs: 'tabs',
  Textarea: 'textarea',
  Tooltip: 'tooltip',
}

const ownedCompositionComponents: Record<string, string> = {
  AccordionContent: 'Accordion',
  AccordionItem: 'Accordion',
  AccordionTrigger: 'Accordion',
  AvatarFace: 'Avatar',
  Collapsible: 'Accordion',
  Modal: 'Dialog/Sheet',
  SidebarFrameSheetOnlyRender: 'SidebarFrame',
  SidebarFrameSheetResizableRender: 'SidebarFrame',
}

const publicSurfaceFiles = [
  'src/index.ts',
  'src/recipe.ts',
  'src/utils.ts',
  'src/unocss/index.ts',
  'src/unocss/theme.ts',
  'src/tailwind/index.ts',
  'src/shared/provider/index.ts',
  'tsdown.config.ts',
  'package.json',
]

const declarationFiles = existsSync(join(PROJECT_ROOT, 'dist'))
  ? listProjectFiles('dist', ['.d.mts'])
  : []

describe('Plan 006 style-system acceptance audit', () => {
  test('finds no legacy styling tokens in src and never scans docs', () => {
    const violations = findSourceViolations(sourceFiles, sourceTokenRules)

    expect(violations, violations.join('\n')).toEqual([])
    expect(sourceFiles.every((path) => !projectRelative(path).startsWith('docs/'))).toBe(true)
  })

  test('keeps public exports and generated declarations free of removed APIs', () => {
    const packageJson = JSON.parse(readProjectFile('package.json')) as {
      exports: Record<string, unknown>
      files: string[]
      peerDependencies?: Record<string, string>
    }
    const surface = [
      ...publicSurfaceFiles.map((path) => [path, readProjectFile(path)] as const),
      ...declarationFiles.map(
        (path) => [projectRelative(path), readFileSync(path, 'utf8')] as const,
      ),
    ]
    const removedApiRules = [
      /\bcva\b/i,
      /\bextendCN\b/,
      /\bcls-variant\b/i,
      /\btw3\.css\b/i,
      /\btw4\.css\b/i,
      /transformer(?:VariantGroup|InjectPrefix|InjectCompileClass)/,
      /\bmigrate-syntax\b/i,
      /\bbaseUnocssConfig\b/i,
      /\bsimplify(?:Shortcut|Class|Extract)/i,
      /\bLRU\b/i,
      /\bO\(1\)\b/i,
    ]
    const violations = surface.flatMap(([path, contents]) =>
      removedApiRules.filter((rule) => rule.test(contents)).map((rule) => `${path}: ${rule}`),
    )

    expect(violations, violations.join('\n')).toEqual([])
    expect(Object.keys(packageJson.exports).sort()).toEqual(
      ['.', './icon.css', './package.json', './recipe', './tailwind', './unocss', './utils'].sort(),
    )
    expect(packageJson.exports['./icon.css']).toBe('./dist/icon.css')
    expect(packageJson.files).toEqual(['dist'])
    expect(packageJson.peerDependencies?.tailwindcss).toMatch(/^\^4(?:\.\d+)?(?:\.\d+)?$/)
  })

  test('does not add an engine-specific opacity registration or style cache contract', () => {
    const engineFiles = ['src/unocss/theme.ts', 'src/tailwind/index.ts']
    const resolverFiles = ['src/shared/style/recipe.ts', 'src/shared/style/css-vars.ts']

    for (const path of engineFiles) {
      expect(readProjectFile(path), `${path} registers opacity-64`).not.toContain('opacity-64')
    }
    for (const path of resolverFiles) {
      const contents = readProjectFile(path)
      expect(contents, `${path} contains a cache contract`).not.toMatch(/\b(?:LRU|cache)\b/i)
      expect(contents, `${path} contains a variant-result Map`).not.toMatch(/\bMap\b/)
      expect(contents, `${path} contains an O(1) claim`).not.toMatch(/\bO\(1\)\b/i)
    }

    expect(existsSync(join(PROJECT_ROOT, 'dist/tw3.css'))).toBe(false)
    expect(existsSync(join(PROJECT_ROOT, 'dist/tw4.css'))).toBe(false)
  })

  test('maps every public component to one provider owner', () => {
    const barrels = { elements, forms, navigation, overlays }
    const occurrences = new Map<string, string[]>()

    for (const [barrelName, barrel] of Object.entries(barrels)) {
      for (const [name, value] of Object.entries(barrel)) {
        if (!/^[A-Z]/.test(name) || typeof value !== 'function') {
          continue
        }
        occurrences.set(name, [...(occurrences.get(name) ?? []), barrelName])
      }
    }

    const duplicates = [...occurrences.entries()]
      .filter(([, owners]) => owners.length !== 1)
      .map(([name, owners]) => `${name}: ${owners.join(', ')}`)
    const missingOwners = [...occurrences.keys()]
      .filter((name) => !standaloneProviderKeys[name] && !ownedCompositionComponents[name])
      .map((name) => `${name}: no provider key or documented owner`)

    expect(duplicates, duplicates.join('\n')).toEqual([])
    expect(missingOwners, missingOwners.join('\n')).toEqual([])
    expect(readProjectFile('src/index.ts')).toMatch(
      /export \* from '\.\/(?:elements|forms|navigation|overlays)\/index\.ts'/,
    )
    expect(readProjectFile('src/index.ts')).toContain('export { cn, useId }')
    expect(readProjectFile('src/index.ts')).toContain('export type { MoraineTypeConfig }')
  })

  test('keeps the provider key inventory and resolver ownership one-to-one', () => {
    const providerSource = readProjectFile('src/shared/provider/moraine-provider.tsx')
    const interfaceStart = providerSource.indexOf('export interface MoraineConfig')
    const interfaceEnd = providerSource.indexOf(
      '\n}\n\nexport function mergeComponentStyle',
      interfaceStart,
    )
    const providerKeys = [
      ...providerSource
        .slice(interfaceStart, interfaceEnd)
        .matchAll(/^\s{2}([A-Za-z]\w*)\?:\s*ComponentDefaultStyle/gm),
    ].map((match) => match[1])

    expect(providerKeys.sort()).toEqual(Object.values(standaloneProviderKeys).sort())
    expect(new Set(Object.values(standaloneProviderKeys)).size).toBe(
      Object.values(standaloneProviderKeys).length,
    )

    const implementationFiles = listProjectFiles('src', ['.tsx']).filter((path) => {
      const name = projectRelative(path)
      return (
        !name.endsWith('.test.tsx') &&
        !name.endsWith('.ssr.fixture.tsx') &&
        name !== 'src/shared/provider/moraine-provider.tsx'
      )
    })
    const implementationContents = implementationFiles.map(
      (path) => [path, readFileSync(path, 'utf8')] as const,
    )

    for (const providerKey of providerKeys) {
      const readers = implementationContents.filter(([, contents]) =>
        new RegExp(`\\b(?:config|moraine)\\(\\)\\.${providerKey}\\b`).test(contents),
      )
      expect(
        readers.map(([path]) => projectRelative(path)),
        providerKey,
      ).toHaveLength(1)
      expect(readers[0]?.[1], providerKey).toContain('resolveComponentStyle(')
    }
  })

  test('rejects component-specific provider/instance merge chains while allowing local cn composition', () => {
    const violations: string[] = []

    for (const path of listProjectFiles('src', ['.tsx'])) {
      const name = projectRelative(path)
      if (
        name.endsWith('.test.tsx') ||
        name.endsWith('.ssr.fixture.tsx') ||
        name === 'src/shared/provider/moraine-provider.tsx'
      ) {
        continue
      }

      const contents = readFileSync(path, 'utf8')
      const readsInheritedLayers =
        /\b(?:provider|provider[A-Z]\w*|group|composition)\s*(?:\(\))?\??\.\s*(?:classes|styles)\b/.test(
          contents,
        )
      const readsInstanceLayers = /\blocal\.(?:class|classes|style|styles)\b/.test(contents)
      const rebuildsClassesOrStyles =
        /\.\.\.\s*(?:provider|provider[A-Z]\w*|group|local)\??\.(?:classes|styles)\b/.test(
          contents,
        ) ||
        /\bcn\([^\n;]*(?:provider|group)[^\n;]*\blocal\.(?:class|classes|style|styles)\b/.test(
          contents,
        )

      if (readsInheritedLayers && readsInstanceLayers && rebuildsClassesOrStyles) {
        violations.push(`${name}: direct provider/group/instance style reconstruction`)
      }
    }

    expect(violations, violations.join('\n')).toEqual([])
  })

  test('executes the shared resolver contract and keeps its normative test in coverage', () => {
    const testRecipe = recipe({
      slots: ['root', 'content'],
      base: { root: 'recipe-root', content: 'recipe-content' },
    })
    const resolved = resolveComponentStyle({
      slots: testRecipe(),
      provider: {
        classes: { root: 'provider-root', content: 'provider-content' },
        styles: {
          root: { color: 'red', '--provider': '1' },
          content: { color: 'red', '--provider-content': '1' },
        },
      },
      group: {
        classes: { root: 'group-root', content: 'group-content' },
        styles: {
          root: { color: 'purple', '--group': '2' },
          content: { color: 'purple', '--group-content': '2' },
        },
      },
      stateCls: { root: 'state-root', content: 'state-content' },
      instance: {
        class: 'instance-class',
        classes: { root: 'instance-root', content: 'instance-content' },
        style: { color: 'green' },
        styles: {
          root: { color: 'yellow', '--instance': '3' },
          content: { color: 'yellow', '--instance-content': '3' },
        },
      },
      baseStyle: { '--base': '0' },
    })

    expect(resolved.rootClass()).toBe(
      'recipe-root provider-root group-root state-root instance-root instance-class',
    )
    expect(resolved.slotClass('content')).toBe(
      'recipe-content provider-content group-content state-content instance-content',
    )
    expect(resolved.rootStyle()).toEqual({
      '--base': '0',
      color: 'green',
      '--provider': '1',
      '--group': '2',
      '--instance': '3',
    })
    expect(resolved.slotStyle('content')).toEqual({
      color: 'yellow',
      '--provider-content': '1',
      '--group-content': '2',
      '--instance-content': '3',
    })

    const sharedTest = readProjectFile('src/shared/provider/moraine-provider.test.tsx')
    expect(sharedTest).toMatch(/matches the normative precedence table \(§3\.5\.4\)/)
    expect(sharedTest).toContain('resolveComponentStyle')
  })

  test('validates the class-module recipe/static split', () => {
    const classFiles = listProjectFiles('src', ['.class.ts'])

    expect(classFiles).toHaveLength(36)
    for (const path of classFiles) {
      const contents = readFileSync(path, 'utf8')
      const hasRecipe = /\brecipe\s*\(/.test(contents)
      const hasVariantSchema = /\b(?:variants|defaultVariants|compoundVariants)\s*:/.test(contents)
      const hasStaticClassConstant = /\bexport\s+const\s+[A-Z][A-Z0-9_]*_CLASS\b/.test(contents)

      if (hasVariantSchema) {
        expect(hasRecipe, `${projectRelative(path)} must use recipe()`).toBe(true)
      } else {
        expect(
          hasStaticClassConstant,
          `${projectRelative(path)} must expose static *_CLASS constants`,
        ).toBe(true)
      }
    }
  })

  test('checks the generated artifact boundary when dist is present', () => {
    if (!existsSync(join(PROJECT_ROOT, 'dist'))) {
      return
    }

    expect(existsSync(join(PROJECT_ROOT, 'dist/icon.css'))).toBe(true)
    const iconCss = readProjectFile('dist/icon.css')
    expect(iconCss).toMatch(/\.icon-[a-z0-9-]+|\[data-icon=/i)
    expect(existsSync(join(PROJECT_ROOT, 'dist/tw3.css'))).toBe(false)
    expect(existsSync(join(PROJECT_ROOT, 'dist/tw4.css'))).toBe(false)
  })
})
