import { execFileSync } from 'node:child_process'
import {
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  symlinkSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'

export const PROJECT_ROOT = resolve(import.meta.dirname, '../..')

export interface PackedConsumer {
  packageDir: string
  root: string
}

export function createPackedConsumer(): PackedConsumer {
  const root = mkdtempSync(join(tmpdir(), 'moraine-consumer-'))
  const packDir = join(root, 'pack')
  const packageDir = join(root, 'node_modules', 'moraine')
  mkdirSync(packDir, { recursive: true })
  mkdirSync(packageDir, { recursive: true })
  mkdirSync(join(root, 'node_modules', '@subf'), { recursive: true })
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

  execFileSync('pnpm', ['pack', '--pack-destination', packDir], {
    cwd: PROJECT_ROOT,
    stdio: 'pipe',
  })
  const tarball = readdirSync(packDir).find((file) => file.endsWith('.tgz'))
  if (!tarball) {
    throw new Error('pnpm pack did not produce a tarball')
  }

  execFileSync('tar', ['-xzf', join(packDir, tarball), '--strip-components=1', '-C', packageDir], {
    stdio: 'pipe',
  })

  return { packageDir, root }
}

export function removePackedConsumer(consumer: PackedConsumer): void {
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
