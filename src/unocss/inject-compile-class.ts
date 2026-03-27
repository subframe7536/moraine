import type { SourceCodeTransformer } from 'unocss'

import { normalizeId, runTransform } from './shared'

export function injectCompileClassTrigger(value: string, trigger: string): string {
  const trimmed = value.trim()

  if (!trimmed || trimmed.startsWith(trigger)) {
    return value
  }

  const leading = value.slice(0, value.length - value.trimStart().length)
  const trailing = value.slice(value.trimEnd().length)

  return `${leading}${trigger} ${trimmed}${trailing}`
}

export interface TransformerInjectCompileClassOption {
  trigger: string
  idFilter?: (id: string) => boolean
  beforeTransform?: (...args: Parameters<SourceCodeTransformer['transform']>) => void
}

export function transformerInjectCompileClass(
  options: TransformerInjectCompileClassOption,
): SourceCodeTransformer {
  const { trigger, idFilter, beforeTransform } = options

  return {
    name: 'transformer-inject-compile-class',
    enforce: 'pre',
    idFilter: idFilter ? (id) => idFilter(normalizeId(id)) : undefined,
    async transform(code, id, context) {
      const normalizedId = normalizeId(id)

      beforeTransform?.(code, normalizedId, context)
      runTransform(code, normalizedId, (start, end, text, source) => {
        const nextValue = injectCompileClassTrigger(text, trigger)
        const originalSlice = source.slice(start, end)

        if (nextValue === originalSlice) {
          return null
        }

        return { start, end, value: nextValue }
      })
    },
  }
}
