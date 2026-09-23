import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'

import { describe, expect, test } from 'vitest'

import { dataSlotName } from './data-slot.ts'

describe('dataSlotName', () => {
  test.each([
    ['button', 'root', 'button'],
    ['button', 'label', 'button-label'],
    ['avatar-group', 'item', 'avatar-group-item'],
    ['dialog', 'contentClose', 'dialog-content-close'],
  ])('%s.%s', (owner, slot, expected) => {
    expect(dataSlotName(owner, slot)).toBe(expected)
  })
})

test('library anatomy never uses bare slot names or the removed Avatar fallback key', () => {
  const sourceRoot = path.resolve(import.meta.dirname, '..')
  const files = readdirSync(sourceRoot, { recursive: true, encoding: 'utf8' })
    .filter((file) => /\.(ts|tsx)$/.test(file) && !file.endsWith('.test.tsx'))
    .map((file) => path.join(sourceRoot, file))
  const bareSlot =
    /data-slot\s*=\s*["'](?:root|item|content|trigger|label|control|group|overlay|empty)["']/

  for (const file of files) {
    const source = readFileSync(file, 'utf8')
    expect(source, file).not.toMatch(bareSlot)
    if (file.includes('/avatar/')) {
      expect(source, file).not.toContain('fallbackIcon')
    }
  }
})
