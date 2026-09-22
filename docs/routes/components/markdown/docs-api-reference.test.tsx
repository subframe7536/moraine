import { fireEvent, render } from '@solidjs/testing-library'
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

  // Verify composite parts and quick-bar
  expect(view.getByText("import { Dialog } from 'moraine'")).toBeTruthy()
  expect(view.getAllByText('Dialog.Trigger').length).toBeGreaterThanOrEqual(1)
  expect(view.getByText('open')).toBeTruthy()
  expect(view.getByText('asChild')).toBeTruthy()

  // Verify Part Quick-Bar
  const partsNav = view.getByRole('navigation', { name: 'Component parts' })
  expect(partsNav).toBeTruthy()
  expect(view.getByRole('link', { name: 'Dialog' })).toBeTruthy()
  expect(view.getByRole('link', { name: 'Dialog.Trigger' })).toBeTruthy()

  view.unmount()
})

test('places Props before DOM & Styling for single components, and renders polymorphic and generics badges', () => {
  const apiDoc: ComponentApi = {
    key: 'button',
    name: 'Button',
    category: 'general',
    kind: 'single',
    sourcePath: 'src/elements/button/button.tsx',
    description: 'Polymorphic button component.',
    parts: [
      {
        id: 'button',
        name: 'Button',
        access: { kind: 'export', name: 'Button', package: 'moraine' },
        sourcePath: 'src/elements/button/button.tsx',
        generics: [{ name: 'T', constraint: 'ValidComponent', default: "'button'" }],
        rendering: {
          rendersDom: true,
          defaultElement: 'button',
          polymorphic: { name: 'T', constraint: 'ValidComponent', default: "'button'" },
        },
        props: [
          {
            name: 'disabled',
            optional: true,
            type: { text: 'boolean' },
            group: 'behavior',
          },
          {
            name: 'variant',
            optional: false,
            type: { text: "'solid' | 'outline'" },
            default: { kind: 'literal', value: 'solid' },
            group: 'styling',
          },
        ],
        slots: [{ name: 'root' }],
        runtime: [
          {
            name: 'root',
            element: 'button',
            selector: '[data-slot="button"]',
            attributes: [
              {
                name: 'data-disabled',
                kind: 'data',
                value: { kind: 'presence' },
              },
            ],
          },
        ],
        cssVariables: [],
      },
    ],
  }

  const view = render(() => <DocsApiReference apiDoc={apiDoc} />)

  // Verify badges
  expect(view.getByText('renders <button>')).toBeTruthy()
  expect(view.getByText('Polymorphic (as)')).toBeTruthy()
  expect(view.getByText("Generics: <T extends ValidComponent = 'button'>")).toBeTruthy()
  expect(view.getByText('Polymorphic button component.')).toBeTruthy()

  // Verify Props appears BEFORE DOM & Styling in DOM order
  const propsHeading = document.getElementById('api-props')
  const domHeading = document.getElementById('dom-styling')
  expect(propsHeading).toBeTruthy()
  expect(domHeading).toBeTruthy()
  expect(
    propsHeading!.compareDocumentPosition(domHeading!) & Node.DOCUMENT_POSITION_FOLLOWING,
  ).toBeTruthy()

  view.unmount()
})

test('filters props via category pills and live search input', () => {
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
            name: 'disabled',
            optional: true,
            type: { text: 'boolean' },
            description: 'Whether button is disabled.',
            group: 'behavior',
          },
          {
            name: 'loading',
            optional: true,
            type: { text: 'boolean' },
            description: 'Active loading state.',
            group: 'behavior',
          },
          {
            name: 'variant',
            optional: false,
            type: { text: "'solid' | 'outline'" },
            description: 'Button visual style variant.',
            group: 'styling',
          },
          {
            name: 'onClick',
            optional: true,
            type: { text: '() => void' },
            description: 'Click callback handler.',
            group: 'behavior',
            traits: ['callback'],
          },
        ],
        slots: [],
        runtime: [],
        cssVariables: [],
      },
    ],
  }

  const view = render(() => <DocsApiReference apiDoc={apiDoc} />)

  // Initially all props are visible
  expect(view.getByText('disabled')).toBeTruthy()
  expect(view.getByText('loading')).toBeTruthy()
  expect(view.getByText('variant*')).toBeTruthy()
  expect(view.getByText('onClick')).toBeTruthy()

  // Category filter pill: click Styling
  const stylingPill = view.getByRole('button', { name: /Styling/ })
  stylingPill.click()

  // Only variant should remain
  expect(view.getByText('variant*')).toBeTruthy()
  expect(view.queryByText('disabled')).toBeNull()
  expect(view.queryByText('loading')).toBeNull()

  // Click All
  const allPill = view.getByRole('button', { name: /All/ })
  allPill.click()
  expect(view.getByText('disabled')).toBeTruthy()

  // Live search: search for 'loading'
  const searchInput = view.getByPlaceholderText('Filter props...')
  fireEvent.input(searchInput, { target: { value: 'loading' } })

  expect(view.getByText('loading')).toBeTruthy()
  expect(view.queryByText('disabled')).toBeNull()
  expect(view.queryByText('variant*')).toBeNull()

  // Search with no matches
  fireEvent.input(searchInput, { target: { value: 'nonexistent' } })
  expect(view.getByText(/No props matching "nonexistent"/)).toBeTruthy()

  // Reset filter button
  const resetBtn = view.getByRole('button', { name: 'Reset filters' })
  resetBtn.click()
  expect(view.getByText('disabled')).toBeTruthy()

  view.unmount()
})

test('expands prop row on click to show full TypeScript signature and copy permalink', () => {
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
            name: 'onClick',
            optional: true,
            type: { text: '(event: MouseEvent) => Promise<void> | void' },
            description: 'Async or sync click handler.',
            group: 'behavior',
            traits: ['callback'],
          },
        ],
        slots: [],
        runtime: [],
        cssVariables: [],
      },
    ],
  }

  const view = render(() => <DocsApiReference apiDoc={apiDoc} />)

  // Initially full TypeScript signature drawer is not expanded
  expect(view.queryByText('Full TypeScript Type')).toBeNull()

  // Trait badge 'fn' is visible
  expect(view.getByText('fn')).toBeTruthy()

  // Click the row to expand
  const row = view.getByText('onClick').closest('tr')!
  row.click()

  // Full type container and copy permalink action should now be visible
  expect(view.getByText('Full TypeScript Type')).toBeTruthy()
  expect(
    view.getAllByText('(event: MouseEvent) => Promise<void> | void').length,
  ).toBeGreaterThanOrEqual(2)
  expect(view.getByText('Copy permalink URL')).toBeTruthy()

  view.unmount()
})
