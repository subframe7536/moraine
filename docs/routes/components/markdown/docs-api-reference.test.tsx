import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { fireEvent, render } from '@solidjs/testing-library'
import { expect, test, vi } from 'vitest'

import { generateApiDoc } from '../../../build/api-doc/extract.ts'
import { loadComponentApiDoc } from '../../../build/api-doc/load.ts'
import type { ComponentDoc } from '../../../build/api-doc/types.ts'
import { writeJsonFiles } from '../../../build/api-doc/write.ts'

import { DocsApiReference, getDocsApiReferenceTocEntries } from './docs-api-reference.tsx'

test('shows the selected slot attribute tables', () => {
  const apiDoc: ComponentDoc = {
    component: {
      key: 'example',
      name: 'Example',
      category: 'general',
      polymorphic: false,
    },
    slots: [
      {
        name: 'root',
        cssVariables: [],
        dataAttributes: [],
        ariaAttributes: [],
      },
      {
        name: 'track',
        cssVariables: [],
        dataAttributes: [
          {
            name: 'data-checked',
            required: false,
            type: 'string | undefined',
            description: 'Present when checked.',
          },
        ],
        ariaAttributes: [
          {
            name: 'aria-checked',
            required: false,
            type: 'boolean | string | undefined',
            description: 'Exposes the checked state.',
          },
        ],
      },
    ],
    props: { own: [], inherited: [] },
  }
  const view = render(() => <DocsApiReference apiDoc={apiDoc} />)

  fireEvent.click(view.getByText('track').closest('button')!)

  expect(view.getByRole('heading', { name: 'Data Attributes' })).toBeTruthy()
  expect(view.getByRole('heading', { name: 'ARIA Attributes' })).toBeTruthy()
  expect(view.getByText('data-checked')).toBeTruthy()
  expect(view.getByText('aria-checked')).toBeTruthy()
  view.unmount()
})

test('generates and displays Field props and slots within the Form page', async () => {
  const projectRoot = path.resolve(import.meta.dirname, '../../../..')
  const result = await generateApiDoc(projectRoot)
  expect(result).not.toBeNull()
  const outputRoot = await mkdtemp(path.join(tmpdir(), 'moraine-form-docs-'))
  const pagesRoot = path.join(outputRoot, 'docs/pages')
  const pageDir = path.join(pagesRoot, '(form)/form')
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
  try {
    await mkdir(pageDir, { recursive: true })
    await writeFile(path.join(pageDir, 'index.mdx'), '# Form\n')
    await writeJsonFiles(pagesRoot, result!)
    expect(warn.mock.calls.flat().join('\n')).not.toContain('"form-field"')

    const apiDoc = loadComponentApiDoc(outputRoot, 'form')
    expect(apiDoc?.primitives?.[0]?.component.name).toBe('form.Field')
    const view = render(() => <DocsApiReference apiDoc={apiDoc!} />)
    expect(view.getByRole('heading', { name: /^form\.FieldLink/ })).toBeTruthy()
    expect(view.getByText('name', { selector: 'td' })).toBeTruthy()
    expect(view.getByText('label', { selector: 'td' })).toBeTruthy()
    expect(view.getByRole('heading', { name: /^form\.Field Attributes/ })).toBeTruthy()
    expect(getDocsApiReferenceTocEntries(apiDoc!)).toContainEqual({
      id: 'api-form-field-attributes',
      label: 'form.Field Attributes',
      level: 2,
    })
    view.unmount()
  } finally {
    warn.mockRestore()
    await rm(outputRoot, { recursive: true, force: true })
  }
})
