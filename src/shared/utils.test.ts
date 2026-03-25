import { createRoot } from 'solid-js'
import { describe, expect, test } from 'vitest'

import { useId } from './utils'

function resolveId(deterministicId?: () => string | null | undefined, prefix?: string): string {
  return createRoot((dispose) => {
    const id = useId(deterministicId, prefix)
    const value = id()
    dispose()
    return value
  })
}

describe('useId', () => {
  test('returns deterministic id when provided', () => {
    expect(resolveId(() => 'custom-id', 'dialog')).toBe('custom-id')
  })

  test('generates id with provided prefix when deterministic id is missing', () => {
    const generatedId = resolveId(() => undefined, 'dialog')
    expect(generatedId.startsWith('dialog-')).toBe(true)
  })

  test('uses flint prefix by default', () => {
    const generatedId = resolveId()
    expect(generatedId.startsWith('fl-')).toBe(true)
  })
})
