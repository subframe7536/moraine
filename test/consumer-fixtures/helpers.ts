import { execFileSync } from 'node:child_process'
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'

export const PROJECT_ROOT = resolve(import.meta.dirname, '../..')

let built = false

function ensureBuild(): void {
  if (!built) {
    // Fixture tests must not inherit an unpublished or stale distribution.
    const distMjs = join(PROJECT_ROOT, 'dist/index.mjs')
    const distDts = join(PROJECT_ROOT, 'dist/index.d.mts')
    if (!existsSync(distMjs) || !existsSync(distDts)) {
      execFileSync('nub', ['run', 'build'], { cwd: PROJECT_ROOT, stdio: 'pipe' })
    }
    built = true
  }
}

export interface IsolatedConsumer {
  packageDir: string
  root: string
}

export function createIsolatedConsumer(): IsolatedConsumer {
  ensureBuild()
  const root = mkdtempSync(join(tmpdir(), 'moraine-consumer-'))
  const packageDir = join(root, 'node_modules', 'moraine')
  mkdirSync(packageDir, { recursive: true })
  mkdirSync(join(root, 'node_modules', '@subf'), { recursive: true })
  mkdirSync(join(root, 'node_modules', '@tanstack'), { recursive: true })
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
  symlinkSync(
    join(PROJECT_ROOT, 'node_modules', '@tanstack', 'virtual-core'),
    join(root, 'node_modules', '@tanstack', 'virtual-core'),
    'junction',
  )

  // Keep the consumer isolated while exercising the built package output.
  cpSync(join(PROJECT_ROOT, 'dist'), join(packageDir, 'dist'), { recursive: true })
  writeFileSync(
    join(packageDir, 'package.json'),
    JSON.stringify({
      name: 'moraine',
      type: 'module',
      exports: {
        '.': {
          solid: './dist/index.jsx',
          default: './dist/index.mjs',
          type: './dist/index.d.mts',
        },
        './package.json': './package.json',
        './icon.css': './dist/icon.css',
        './recipe': './dist/recipe.mjs',
        './tailwind': './dist/tailwind.mjs',
        './unocss': './dist/unocss.mjs',
        './utils': './dist/utils.mjs',
      },
    }),
  )

  return { packageDir, root }
}

export function removeIsolatedConsumer(consumer: IsolatedConsumer): void {
  rmSync(consumer.root, { recursive: true, force: true })
}

export function readPublishedModules(packageDir: string): Array<{ id: string; code: string }> {
  const distDir = join(packageDir, 'dist')
  const modules: Array<{ id: string; code: string }> = []

  function visit(directory: string): void {
    for (const name of readdirSync(directory)) {
      const path = join(directory, name)
      if (statSync(path).isDirectory()) {
        visit(path)
      } else if (path.endsWith('.mjs') || path.endsWith('.jsx')) {
        modules.push({ id: path, code: readFileSync(path, 'utf8') })
      }
    }
  }

  visit(distDir)
  return modules
}

export function verifyConsumerPackageExports(consumer: IsolatedConsumer): void {
  const verificationPath = join(consumer.root, 'verify-exports.mjs')
  writeFileSync(
    verificationPath,
    `
const specifiers = [
  'moraine',
  'moraine/icon.css',
  'moraine/recipe',
  'moraine/tailwind',
  'moraine/unocss',
  'moraine/utils',
]

for (const specifier of specifiers) {
  import.meta.resolve(specifier)
}
`,
  )
  execFileSync('nub', [verificationPath], { cwd: consumer.root, stdio: 'pipe' })
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
