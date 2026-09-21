import { describe, expect, test } from 'vitest'

import { createApiReferenceModel } from './presentation'
import type { ComponentApi } from './types'

function component(kind: ComponentApi['kind']): ComponentApi {
  return {
    key: 'demo',
    name: 'Demo',
    category: 'elements',
    kind,
    sourcePath: 'src/demo.tsx',
    parts: [
      {
        id: 'demo',
        name: 'Demo',
        access: { kind: 'export', name: 'Demo', package: 'moraine' },
        sourcePath: 'src/demo.tsx',
        rendering: { rendersDom: true },
        props: [],
        slots: [{ name: 'root' }],
        runtime: [
          {
            name: 'root',
            slot: 'root',
            selector: '[data-slot="root"]',
            attributes: [
              {
                name: 'data-disabled',
                kind: 'data',
                value: { kind: 'presence' },
                description: 'Present when disabled.',
              },
            ],
          },
          {
            name: 'wrapper',
            selector: '[data-slot="wrapper"]',
            attributes: [
              {
                name: 'data-disabled',
                kind: 'data',
                value: { kind: 'presence' },
                description: 'Present when disabled.',
              },
              {
                name: 'data-state',
                kind: 'data',
                value: { kind: 'enum', values: ['closed', 'open'] },
              },
              {
                name: 'aria-expanded',
                kind: 'aria',
                value: { kind: 'boolean' },
              },
            ],
          },
        ],
        cssVariables: [{ name: '--size', target: 'root' }],
      },
    ],
  }
}

describe('createApiReferenceModel', () => {
  test.each(['single', 'composite'] as const)(
    'normalizes %s components without turning DOM targets into slots',
    (kind) => {
      const model = createApiReferenceModel(component(kind))!
      const part = model.parts[0]!

      expect(part.slots?.map((slot) => slot.name)).toEqual(['root'])
      expect(part.anatomy?.map((target) => target.name)).toEqual(['root', 'wrapper'])
      expect(part.dataAttributes).toEqual([
        expect.objectContaining({
          name: 'data-disabled',
          targets: ['root', 'wrapper'],
          value: 'Presence',
        }),
        expect.objectContaining({ name: 'data-state', value: 'closed | open' }),
      ])
      expect(part.accessibility).toEqual([
        expect.objectContaining({ name: 'aria-expanded', value: 'boolean' }),
      ])
      expect(part.cssVariables).toEqual([{ name: '--size', target: 'root' }])
    },
  )

  test('keeps context-only parts free of fabricated anatomy', () => {
    const api = component('composite')
    api.parts[0] = {
      ...api.parts[0]!,
      rendering: { rendersDom: false },
      runtime: [],
      cssVariables: [],
    }

    expect(createApiReferenceModel(api)?.parts[0]).toEqual(
      expect.objectContaining({ rendersDom: false }),
    )
    expect(createApiReferenceModel(api)?.parts[0]?.anatomy).toBeUndefined()
  })

  test('does not combine same-name attributes with different semantics', () => {
    const api = component('single')
    api.parts[0]!.runtime[1]!.attributes[0]!.description = 'Local disabled state.'

    expect(
      createApiReferenceModel(api)?.parts[0]?.dataAttributes?.filter(
        (attribute) => attribute.name === 'data-disabled',
      ),
    ).toHaveLength(2)
  })
})
