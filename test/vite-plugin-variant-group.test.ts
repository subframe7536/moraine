import { describe, expect, test } from 'vitest'

import { variantGroupPlugin } from '../vite-plugin-variant-group'

describe('variantGroupPlugin', () => {
  test('uses an object transform hook and expands variant groups', async () => {
    const transform = variantGroupPlugin().transform
    expect(transform).toBeDefined()
    expect(typeof transform).not.toBe('function')

    if (!transform || typeof transform === 'function') {
      throw new Error('Expected an object transform hook')
    }

    expect(transform.filter?.id).toBeInstanceOf(RegExp)
    expect(transform.filter?.code).toBeInstanceOf(RegExp)

    const result = await transform.handler(
      "export const BUTTON_CLASS = 'hover:(bg-primary text-primary-foreground)'\n",
      '/project/src/elements/button/button.class.ts',
    )

    expect(result).toMatchObject({
      code: "export const BUTTON_CLASS = 'hover:bg-primary hover:text-primary-foreground'\n",
    })
  })

  test('returns null when the transformer makes no change', async () => {
    const transform = variantGroupPlugin().transform
    if (!transform || typeof transform === 'function') {
      throw new Error('Expected an object transform hook')
    }

    await expect(
      transform.handler("export const BUTTON_CLASS = 'bg-primary'\n", '/project/button.class.ts'),
    ).resolves.toBeNull()
  })
})
