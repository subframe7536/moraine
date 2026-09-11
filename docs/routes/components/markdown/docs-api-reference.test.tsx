import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { render } from '@solidjs/testing-library'
import { expect, test, vi } from 'vitest'

import { generateApiDoc } from '../../../build/api-doc/extract.ts'
import { loadComponentApiDoc } from '../../../build/api-doc/load.ts'
import { writeJsonFiles } from '../../../build/api-doc/write.ts'

import { DocsApiReference, getDocsApiReferenceTocEntries } from './docs-api-reference.tsx'

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
