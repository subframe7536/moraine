import path from 'node:path'

import { describe, expect, test } from 'vitest'

import { generateApiDoc } from './extract'

describe('generateApiDoc (source-first)', () => {
  const projectRoot = path.resolve(__dirname, '../../..')

  test('generates API documentation for the whole library from source', async () => {
    const result = await generateApiDoc(projectRoot)

    expect(result.indexDoc.components.length).toBe(44)
    expect(result.componentDocs.size).toBe(44)

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
  })

  test('generates and writes all api.json files to disk', async () => {
    const { runApiDocGeneration } = await import('../plugins/api-doc-generator')
    await runApiDocGeneration(projectRoot)
  })
})
