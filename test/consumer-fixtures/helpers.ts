import { execFileSync } from 'node:child_process'
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'

export const PROJECT_ROOT = resolve(import.meta.dirname, '../..')
const CLASS_TOKENS_PATH = join(PROJECT_ROOT, 'node_modules/.cache/moraine/class-tokens.json')

let built = false

export function ensureBuild(): void {
  if (!built) {
    // Fixture tests must not inherit an unpublished or stale distribution.
    const distMjs = join(PROJECT_ROOT, 'dist/index.mjs')
    const distDts = join(PROJECT_ROOT, 'dist/index.d.mts')
    if (!existsSync(distMjs) || !existsSync(distDts)) {
      execFileSync('pnpm', ['run', 'build'], { cwd: PROJECT_ROOT, stdio: 'pipe' })
    }
    built = true
  }
}

export interface IsolatedConsumer {
  packageDir: string
  root: string
}

export function createIsolatedConsumer(options: { virtualizer?: boolean } = {}): IsolatedConsumer {
  ensureBuild()
  const root = mkdtempSync(join(tmpdir(), 'moraine-consumer-'))
  const packageDir = join(root, 'node_modules', 'moraine')
  mkdirSync(packageDir, { recursive: true })
  mkdirSync(join(root, 'node_modules', '@subf'), { recursive: true })
  mkdirSync(join(root, 'node_modules', '@tanstack'), { recursive: true })
  for (const name of ['@formisch/solid', '@floating-ui/dom']) {
    const destination = join(root, 'node_modules', name)
    mkdirSync(dirname(destination), { recursive: true })
    symlinkSync(join(PROJECT_ROOT, 'node_modules', name), destination, 'junction')
  }
  symlinkSync(
    join(PROJECT_ROOT, 'node_modules', 'tailwindcss'),
    join(root, 'node_modules', 'tailwindcss'),
    'junction',
  )
  symlinkSync(
    join(PROJECT_ROOT, 'node_modules', '@subf', 'unocss'),
    join(root, 'node_modules', '@subf', 'unocss'),
    'junction',
  )
  symlinkSync(
    join(PROJECT_ROOT, 'node_modules', 'solid-js'),
    join(root, 'node_modules', 'solid-js'),
    'junction',
  )
  symlinkSync(
    join(PROJECT_ROOT, 'node_modules', 'cn'),
    join(root, 'node_modules', 'cn'),
    'junction',
  )
  if (options.virtualizer !== false) {
    symlinkSync(
      join(PROJECT_ROOT, 'node_modules', '@tanstack', 'virtual-core'),
      join(root, 'node_modules', '@tanstack', 'virtual-core'),
      'junction',
    )
  }

  // Keep the consumer isolated while exercising the built package output.
  cpSync(join(PROJECT_ROOT, 'dist'), join(packageDir, 'dist'), { recursive: true })
  writeFileSync(
    join(packageDir, 'package.json'),
    readFileSync(join(PROJECT_ROOT, 'package.json'), 'utf8'),
  )

  return { packageDir, root }
}

export function removeIsolatedConsumer(consumer: IsolatedConsumer): void {
  rmSync(consumer.root, { recursive: true, force: true })
}

/** Reads distribution classes collected by the consumer test setup. */
export function readBuiltClassTokens(): string[] {
  return JSON.parse(readFileSync(CLASS_TOKENS_PATH, 'utf8')) as string[]
}

export function verifyConsumerPackageExports(consumer: IsolatedConsumer): void {
  const verificationPath = join(consumer.root, 'verify-exports.mjs')
  writeFileSync(
    verificationPath,
    `
const specifiers = [
  'moraine',
  'moraine/icon.css',
  'moraine/tailwind',
  'moraine/unocss',
  'moraine/utils',
  'moraine/theme',
  'moraine/virtualizer',
]

const { defineTheme } = await import('moraine/theme')
if (Object.keys(defineTheme()).length !== 0) throw new Error('Expected opaque Theme')

const unocss = await import('moraine/unocss')
if (Object.keys(unocss).join(',') !== 'presetMoraine') {
  throw new Error('UnoCSS must expose only presetMoraine at runtime')
}

const utils = await import('moraine/utils')
const utilityNames = [
  'createBaseSelectSearchInput',
  'createControllableValue',
  'createDisclosureState',
  'createEventListener',
  'createEventListenerMap',
  'createId',
  'createMediaQuery',
  'createSelectableCollectionNavigation',
  'createSlider',
  'createTransitionPresence',
  'useAlertDialog',
]
if (Object.keys(utils).sort().join(',') !== utilityNames.join(',')) {
  throw new Error('Unexpected moraine/utils runtime exports')
}

for (const specifier of specifiers) {
  import.meta.resolve(specifier)
}

try {
  import.meta.resolve('moraine/styles')
  throw new Error('moraine/styles must not be a public entry')
} catch (error) {
  if (error?.code !== 'ERR_PACKAGE_PATH_NOT_EXPORTED') throw error
}
`,
  )
  execFileSync('node', [verificationPath], { cwd: consumer.root, stdio: 'pipe' })
}

export function resolveStylesheet(id: string, base: string, packageDir: string): string {
  if (id === 'tailwindcss') {
    return resolve(PROJECT_ROOT, 'node_modules/tailwindcss/index.css')
  }
  if (id === 'moraine/icon.css') {
    return join(packageDir, 'dist/icon.css')
  }
  return resolve(base, id)
}

export function loadStylesheet(path: string): { path: string; base: string; content: string } {
  return {
    path,
    base: dirname(path),
    content: readFileSync(path, 'utf8'),
  }
}
