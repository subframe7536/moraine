import { render } from '@solidjs/testing-library'
import { expect, test } from 'vitest'

import type { ComponentApi } from '../../../build/api-doc/types.ts'

import { DocsApiReference } from './docs-api-reference.tsx'

test('shows anatomy and separates data from accessibility metadata', () => {
  const apiDoc: ComponentApi = {
    key: 'example',
    name: 'Example',
    category: 'general',
    kind: 'single',
    sourcePath: 'src/example/example.tsx',
    parts: [
      {
        id: 'example',
        name: 'Example',
        access: { kind: 'export', name: 'Example', package: 'moraine' },
        sourcePath: 'src/example/example.tsx',
        props: [],
        slots: [{ name: 'root' }, { name: 'track' }],
        runtime: [
          {
            name: 'track',
            slot: 'track',
            selector: '[data-slot="track"]',
            element: 'div',
            attributes: [
              {
                name: 'data-checked',
                kind: 'data',
                value: { kind: 'presence' },
                description: 'Present when checked.',
              },
              {
                name: 'aria-checked',
                kind: 'aria',
                value: { kind: 'boolean' },
                description: 'Exposes the checked state.',
              },
            ],
          },
        ],
        cssVariables: [],
      },
    ],
  }
  const view = render(() => <DocsApiReference apiDoc={apiDoc} />)

  expect(view.getByRole('heading', { name: 'Data Attributes' })).toBeTruthy()
  expect(view.getByRole('heading', { name: 'Accessibility' })).toBeTruthy()
  expect(view.getByText('[data-slot="track"]')).toBeTruthy()
  expect(view.getByText('Presence')).toBeTruthy()
  expect(view.getByText('data-checked')).toBeTruthy()
  expect(view.getByText('aria-checked')).toBeTruthy()
  expect(document.getElementById('dom-styling')).toBeTruthy()
  view.unmount()
})

test('renders prop groups, required markers, and literal defaults (empty string, 0, false)', () => {
  const apiDoc: ComponentApi = {
    key: 'button',
    name: 'Button',
    category: 'general',
    kind: 'single',
    sourcePath: 'src/elements/button/button.tsx',
    parts: [
      {
        id: 'button',
        name: 'Button',
        access: { kind: 'export', name: 'Button', package: 'moraine' },
        sourcePath: 'src/elements/button/button.tsx',
        props: [
          {
            name: 'variant',
            optional: false, // required -> should have *
            type: { text: "'solid' | 'outline'" },
            default: { kind: 'literal', value: '' }, // empty string -> should display ""
            group: 'styling',
          },
          {
            name: 'count',
            optional: true,
            type: { text: 'number' },
            default: { kind: 'literal', value: 0 }, // 0 -> should display 0
            group: 'data',
          },
          {
            name: 'disabled',
            optional: true,
            type: { text: 'boolean' },
            default: { kind: 'literal', value: false }, // false -> should display false
            group: 'behavior',
          },
        ],
        slots: [],
        runtime: [],
        cssVariables: [],
      },
    ],
  }

  const view = render(() => <DocsApiReference apiDoc={apiDoc} />)

  // Verify section title is API (level 2) and Props (level 3)
  expect(view.getByRole('heading', { name: /^API/, level: 2 })).toBeTruthy()
  expect(view.getByRole('heading', { name: /^Props/, level: 3 })).toBeTruthy()
  expect(document.getElementById('api-props')).toBeTruthy()

  // Verify group headings are internal headings (level 4), not section titles (level 3)
  expect(view.getByRole('heading', { name: /Styling/, level: 4 })).toBeTruthy()
  expect(view.getByRole('heading', { name: /Data/, level: 4 })).toBeTruthy()
  expect(view.getByRole('heading', { name: /Behavior/, level: 4 })).toBeTruthy()
  expect(view.queryByRole('heading', { name: /^Styling/, level: 3 })).toBeNull()

  // Verify required marker
  expect(view.getByText('variant*')).toBeTruthy()

  // Verify defaults
  expect(view.getByText('""')).toBeTruthy()
  expect(view.getByText('0')).toBeTruthy()
  expect(view.getByText('false')).toBeTruthy()

  // Verify import statement is not rendered under Props for single component
  expect(view.queryByText("import { Button } from 'moraine'")).toBeNull()

  view.unmount()
})

test('renders composite components with part headings and access text', () => {
  const apiDoc: ComponentApi = {
    key: 'dialog',
    name: 'Dialog',
    category: 'overlay',
    kind: 'composite',
    sourcePath: 'src/overlays/dialog/dialog.tsx',
    parts: [
      {
        id: 'dialog',
        name: 'Dialog',
        access: { kind: 'export', name: 'Dialog', package: 'moraine' },
        sourcePath: 'src/overlays/dialog/dialog.tsx',
        props: [
          {
            name: 'open',
            optional: true,
            type: { text: 'boolean' },
            group: 'state',
          },
        ],
        slots: [],
        runtime: [],
        cssVariables: [],
      },
      {
        id: 'dialog-trigger',
        name: 'Dialog.Trigger',
        access: { kind: 'attached', root: 'Dialog', member: 'Trigger' },
        sourcePath: 'src/overlays/dialog/dialog-trigger.tsx',
        props: [
          {
            name: 'asChild',
            optional: true,
            type: { text: 'boolean' },
            group: 'rendering',
          },
        ],
        slots: [],
        runtime: [],
        cssVariables: [],
      },
    ],
  }

  const view = render(() => <DocsApiReference apiDoc={apiDoc} />)

  expect(view.getByText("import { Dialog } from 'moraine'")).toBeTruthy()
  expect(view.getAllByText('Dialog.Trigger').length).toBeGreaterThanOrEqual(1)
  expect(view.getByText('open')).toBeTruthy()
  expect(view.getByText('asChild')).toBeTruthy()

  view.unmount()
})
