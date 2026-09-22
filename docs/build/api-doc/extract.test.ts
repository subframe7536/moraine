import path from 'node:path'

import { describe, expect, test } from 'vitest'

import { generateApiDoc } from './extract'

describe('generateApiDoc (source-first)', () => {
  const projectRoot = path.resolve(__dirname, '../../..')

  test('generates API documentation for the whole library from source', async () => {
    const result = await generateApiDoc(projectRoot)

    expect(result.indexDoc.components.length).toBe(44)
    expect(result.componentDocs.size).toBe(44)
    expect(result.diagnostics).toEqual([])

    for (const component of result.componentDocs.values()) {
      expect(component.parts.length, component.name).toBeGreaterThan(0)
      for (const part of component.parts) {
        if (part.rendering?.rendersDom === false) {
          expect(part.runtime, part.name).toEqual([])
        } else {
          expect(part.runtime.length, part.name).toBeGreaterThan(0)
        }
      }
    }

    // Verify Button
    const button = result.componentDocs.get('button')
    expect(button).toBeDefined()
    expect(button?.kind).toBe('single')
    expect(button?.parts[0]?.name).toBe('Button')
    expect(button?.parts[0]?.rendering?.defaultElement).toBe('button')
    expect(button?.parts[0]?.props.some((p) => p.name === 'variant')).toBe(true)

    // Verify Dialog
    const dialog = result.componentDocs.get('dialog')
    expect(dialog).toBeDefined()
    expect(dialog?.kind).toBe('composite')
    expect(dialog?.parts.map((p) => p.name)).toEqual([
      'Dialog',
      'Dialog.Trigger',
      'Dialog.Content',
      'Dialog.Close',
    ])
    expect(dialog?.parts[0]?.slots.map((s) => s.name)).toContain('contentClose')

    // Verify Form
    const form = result.componentDocs.get('form')
    expect(form).toBeDefined()
    expect(form?.kind).toBe('single')
    expect(form?.parts.map((p) => p.name)).toEqual(['form.Form', 'form.Field'])
    expect(form?.parts[0]?.access.kind).toBe('factory-member')

    // Verify Select
    const select = result.componentDocs.get('select')
    expect(select).toBeDefined()
    expect(select?.kind).toBe('single')
    expect(select?.item).toBeDefined()
    expect(select?.item?.props.map((p) => p.name)).toContain('value')

    // Verify BaseSelect
    const baseSelect = result.componentDocs.get('base-select')
    expect(baseSelect).toBeDefined()
    expect(baseSelect?.kind).toBe('composite')
    expect(baseSelect?.parts.length).toBe(10)
    expect(baseSelect?.parts[0]?.rendering?.rendersDom).toBe(false)
    expect(baseSelect?.parts[0]?.runtime).toEqual([])

    const runtimeTarget = (componentKey: string, partName: string, targetName: string) =>
      result.componentDocs
        .get(componentKey)
        ?.parts.find((part) => part.name === partName)
        ?.runtime.find((target) => target.name === targetName)
    const attributeNames = (componentKey: string, partName: string, targetName: string) =>
      runtimeTarget(componentKey, partName, targetName)?.attributes.map(
        (attribute) => attribute.name,
      )

    expect(
      runtimeTarget('checkbox', 'Checkbox', 'control')?.attributes.find(
        (attribute) => attribute.name === 'aria-checked',
      )?.value,
    ).toEqual({ kind: 'dynamic' })
    expect(runtimeTarget('button', 'Button', 'leading')?.element).toBe('div')
    expect(runtimeTarget('button', 'Button', 'trailing')?.element).toBe('div')
    expect(runtimeTarget('base-select', 'BaseSelect.Content', 'content')).toEqual(
      expect.objectContaining({ selector: '[data-slot="content"]', element: 'div' }),
    )
    expect(runtimeTarget('base-select', 'BaseSelect.Content', 'content')?.selector).not.toContain(
      'positioner',
    )
    expect(attributeNames('popover', 'Popover.Content', 'content')).toEqual(
      expect.arrayContaining(['data-expanded', 'data-closed', 'data-side']),
    )
    expect(attributeNames('tooltip', 'Tooltip.Content', 'content')).toEqual(
      expect.arrayContaining(['data-expanded', 'data-closed', 'data-instant-motion', 'data-side']),
    )
    expect(runtimeTarget('dropdown-menu', 'DropdownMenu.Trigger', 'trigger')?.selector).toBe(
      '[data-slot="trigger"]',
    )
    expect(runtimeTarget('context-menu', 'ContextMenu.Trigger', 'trigger')?.selector).toBe(
      '[data-slot="trigger"]',
    )
    expect(runtimeTarget('dialog', 'Dialog.Content', 'contentClose')?.element).toBe('button')
    expect(runtimeTarget('sheet', 'Sheet.Content', 'contentClose')?.element).toBe('button')

    for (const [componentKey, partName] of [
      ['modal', 'Modal.Trigger'],
      ['dialog', 'Dialog.Trigger'],
      ['sheet', 'Sheet.Trigger'],
    ] as const) {
      expect(attributeNames(componentKey, partName, 'trigger')).toEqual(
        expect.arrayContaining(['aria-expanded', 'data-expanded', 'data-closed']),
      )
    }

    for (const component of result.componentDocs.values()) {
      for (const part of component.parts) {
        for (const target of part.runtime) {
          const selectorSlot = target.selector?.match(/^\[data-slot="([^"]+)"\]$/)?.[1]
          if (target.slot && selectorSlot) {
            expect(selectorSlot, `${part.name}.${target.name}`).toBe(target.slot)
            expect(selectorSlot, `${part.name}.${target.name}`).not.toBe('positioner')
          }
        }
      }
    }
  })

  test('produces byte-identical deterministic generation output on repeated runs', async () => {
    const run1 = await generateApiDoc(projectRoot)
    const run2 = await generateApiDoc(projectRoot)

    const json1 = JSON.stringify(
      {
        index: run1.indexDoc,
        components: [...run1.componentDocs.entries()].sort(([a], [b]) => a.localeCompare(b)),
      },
      null,
      2,
    )

    const json2 = JSON.stringify(
      {
        index: run2.indexDoc,
        components: [...run2.componentDocs.entries()].sort(([a], [b]) => a.localeCompare(b)),
      },
      null,
      2,
    )

    expect(json1).toBe(json2)
  }, 15_000)

  test('generates and writes all api.json files to disk', async () => {
    const { runApiDocGeneration } = await import('../plugins/api-doc-generator')
    await runApiDocGeneration(projectRoot)
  })
})
