import { existsSync, readFileSync, statSync } from 'node:fs'

import MagicString from 'magic-string'
import path from 'pathe'
import { parseSync } from 'vite'
import type { Plugin } from 'vite'

export interface DocsDevBarrelPluginOptions {
  projectRoot: string
}

interface ExportBinding {
  target: string
  exportedName: string
}

function resolveFileTarget(baseDir: string, specifier: string): string | null {
  const candidate = path.resolve(baseDir, specifier)
  for (const file of [
    candidate,
    `${candidate}.ts`,
    `${candidate}.tsx`,
    path.join(candidate, 'index.ts'),
    path.join(candidate, 'index.tsx'),
  ]) {
    if (existsSync(file) && statSync(file).isFile()) {
      return path.normalize(file)
    }
  }
  return null
}

function collectExportBindings(
  filePath: string,
  srcDir: string,
  barrelCache = new Map<string, Map<string, ExportBinding>>(),
): Map<string, ExportBinding> {
  const normalized = path.normalize(filePath)
  const cached = barrelCache.get(normalized)
  if (cached) {
    return cached
  }
  const bindings = new Map<string, ExportBinding>()
  barrelCache.set(normalized, bindings)

  if (!existsSync(normalized)) {
    return bindings
  }

  const code = readFileSync(normalized, 'utf8')
  const parsed = parseSync(normalized, code, {
    lang: normalized.endsWith('.tsx') ? 'tsx' : 'ts',
  })
  const componentsIndex = path.join(srcDir, 'components/index.ts')

  for (const node of parsed.program.body) {
    if (node.type !== 'ExportNamedDeclaration' && node.type !== 'ExportAllDeclaration') {
      continue
    }
    if (node.exportKind === 'type' || !node.source) {
      continue
    }
    const target = resolveFileTarget(path.dirname(normalized), node.source.value)
    if (!target) {
      continue
    }

    if (node.type === 'ExportAllDeclaration') {
      for (const [key, binding] of collectExportBindings(target, srcDir, barrelCache)) {
        bindings.set(key, binding)
      }
      continue
    }

    const shouldUnwrapBarrel = target === componentsIndex
    const nested = shouldUnwrapBarrel
      ? collectExportBindings(target, srcDir, barrelCache)
      : undefined

    for (const spec of node.specifiers) {
      if (spec.exportKind === 'type') {
        continue
      }
      const exported =
        spec.exported.type === 'Identifier' ? spec.exported.name : spec.exported.value
      const local = spec.local.type === 'Identifier' ? spec.local.name : spec.local.value
      const resolved = nested?.get(local)
      bindings.set(exported, resolved ?? { target, exportedName: local })
    }
  }

  return bindings
}

function isBarrelSource(
  source: string,
  importerFile: string,
  srcDir: string,
  srcIndexFile: string,
): boolean {
  if (source === 'moraine' || source === '@src') {
    return true
  }
  if (!source.startsWith('.')) {
    return false
  }
  const resolved = path.normalize(path.resolve(path.dirname(importerFile), source))
  return resolved === srcDir || resolved === path.join(srcDir, 'index') || resolved === srcIndexFile
}

export function docsDevBarrelPlugin(options: DocsDevBarrelPluginOptions): Plugin {
  const docsRoutesDir = path.normalize(path.join(options.projectRoot, 'docs/routes'))
  const docsPagesDir = path.normalize(path.join(options.projectRoot, 'docs/pages'))
  const srcDir = path.normalize(path.join(options.projectRoot, 'src'))
  const srcIndexFile = path.join(srcDir, 'index.ts')
  let bindings: Map<string, ExportBinding> | null = null

  const getBindings = () => {
    bindings ??= collectExportBindings(srcIndexFile, srcDir)
    return bindings
  }

  return {
    name: 'moraine-docs-dev-barrel',
    apply: 'serve',
    transform(code, id) {
      const cleanId = id.split('?')[0]
      if (
        !cleanId ||
        (!cleanId.startsWith(`${docsRoutesDir}/`) && !cleanId.startsWith(`${docsPagesDir}/`))
      ) {
        return null
      }
      if (
        cleanId.endsWith('.test.ts') ||
        cleanId.endsWith('.test.tsx') ||
        id.includes('?preview-source')
      ) {
        return null
      }
      if (!code.includes('moraine') && !code.includes('/src')) {
        return null
      }
      const ext = path.extname(cleanId)
      if (!['.js', '.jsx', '.ts', '.tsx', '.mdx', '.md'].includes(ext)) {
        return null
      }

      const parsed = parseSync(cleanId, code, {
        lang: ext === '.tsx' || ext === '.jsx' || ext === '.mdx' ? 'tsx' : 'ts',
      })
      const exportMap = getBindings()
      let ms: MagicString | null = null

      for (const node of parsed.program.body) {
        if (node.type !== 'ImportDeclaration' || node.importKind === 'type') {
          continue
        }
        const sourceValue = node.source.value
        if (!isBarrelSource(sourceValue, cleanId, srcDir, srcIndexFile)) {
          continue
        }
        if (
          node.specifiers.length === 0 ||
          node.specifiers.some((spec) => spec.type !== 'ImportSpecifier')
        ) {
          continue
        }

        const byTarget = new Map<string, Array<string>>()
        const fallbackSpecs: Array<string> = []

        for (const spec of node.specifiers) {
          if (spec.type !== 'ImportSpecifier' || spec.importKind === 'type') {
            continue
          }
          const importedName =
            spec.imported.type === 'Identifier' ? spec.imported.name : spec.imported.value
          const localName = spec.local.name
          const binding = exportMap.get(importedName)
          if (!binding) {
            const alias =
              importedName === localName ? importedName : `${importedName} as ${localName}`
            fallbackSpecs.push(alias)
            continue
          }

          const specText =
            binding.exportedName === localName
              ? localName
              : `${binding.exportedName} as ${localName}`
          const list = byTarget.get(binding.target) ?? []
          list.push(specText)
          byTarget.set(binding.target, list)
        }

        if (byTarget.size === 0) {
          continue
        }

        const lines: Array<string> = []
        for (const [target, specs] of byTarget) {
          lines.push(`import { ${specs.join(', ')} } from ${JSON.stringify(target)};`)
        }
        if (fallbackSpecs.length > 0) {
          lines.push(`import { ${fallbackSpecs.join(', ')} } from ${JSON.stringify(sourceValue)};`)
        }

        ms ??= new MagicString(code)
        ms.overwrite(node.start, node.end, lines.join('\n'))
      }

      if (!ms) {
        return null
      }

      return {
        code: ms.toString(),
        map: ms.generateMap({ hires: true }),
      }
    },
  }
}
