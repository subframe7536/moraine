import { fireEvent, render } from '@solidjs/testing-library'
import { createComponent } from 'solid-js'
import type { Component } from 'solid-js'
import { afterEach, beforeAll, describe, expect, test } from 'vitest'

import { DocsDemoBlock } from './docs-demo-block.tsx'
import type { DocsExampleControlValues } from './docs-example-controls.tsx'

const PLAYGROUND_CONTROLS = [
  { kind: 'input', prop: 'label', label: 'Label', defaultValue: 'Save' },
  {
    kind: 'select',
    prop: 'variant',
    label: 'Variant',
    defaultValue: 'default',
    options: [
      { label: 'Default', value: 'default' },
      { label: 'Secondary', value: 'secondary' },
    ],
  },
  { kind: 'switch', prop: 'disabled', label: 'Disabled', defaultValue: false },
] as const

afterEach(() => {
  document.body.innerHTML = ''
})

beforeAll(() => {
  globalThis.ResizeObserver = class {
    constructor(_callback: ResizeObserverCallback) {}
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
    takeRecords(): ResizeObserverEntry[] {
      return []
    }
  }
})

describe('DocsDemoBlock', () => {
  test('defers the interactive preview until after hydration and updates it from all controls', async () => {
    let previewCreates = 0
    const Preview: Component<DocsExampleControlValues> = (props) => {
      previewCreates += 1
      return (
        <output data-testid="preview">
          {String(props.label)}:{String(props.variant)}:{String(props.disabled)}
        </output>
      )
    }
    const screen = render(() => (
      <DocsDemoBlock
        component={Preview}
        source="<Button>Save</Button>"
        playground
        controls={PLAYGROUND_CONTROLS}
      />
    ))

    expect(screen.queryByTestId('preview')).toBeNull()
    await Promise.resolve()
    expect(screen.getByTestId('preview').textContent).toBe('Save:default:false')
    expect(previewCreates).toBe(1)

    await fireEvent.input(screen.getByLabelText('Label'), { target: { value: 'Publish' } })
    expect(screen.getByTestId('preview').textContent).toBe('Publish:default:false')

    await fireEvent.click(screen.getByRole('combobox'))
    const secondary = document.body.querySelectorAll('[data-slot="item"]')[1]
    expect(secondary).not.toBeNull()
    await fireEvent.click(secondary!)
    expect(screen.getByTestId('preview').textContent).toBe('Publish:secondary:false')

    await fireEvent.click(screen.getByRole('switch', { name: 'Disabled' }))
    expect(screen.getByTestId('preview').textContent).toBe('Publish:secondary:true')

    await fireEvent.click(screen.getByRole('button', { name: 'Reset' }))
    expect(screen.getByTestId('preview').textContent).toBe('Save:default:false')
    expect(screen.queryByRole('button', { name: 'Reset' })).toBeNull()
    expect(previewCreates).toBe(1)
  })

  test('keeps invalid and legacy control input from changing the preview shell', async () => {
    const Preview: Component<DocsExampleControlValues> = () => (
      <span data-testid="preview">Ready</span>
    )
    const screen = render(() => (
      <DocsDemoBlock component={Preview} source="source" playground controls={{ invalid: true }} />
    ))

    expect(screen.queryByRole('group', { name: 'Example controls' })).toBeNull()
    await Promise.resolve()
    expect(screen.getByTestId('preview').textContent).toBe('Ready')
  })

  test('snapshots component, source, and static controls once', async () => {
    let componentReads = 0
    let sourceReads = 0
    let playgroundReads = 0
    let controlsReads = 0
    const Preview: Component<DocsExampleControlValues> = () => (
      <span data-testid="preview">Ready</span>
    )

    const screen = render(() =>
      createComponent(DocsDemoBlock, {
        get component() {
          componentReads += 1
          return Preview
        },
        get source() {
          sourceReads += 1
          return 'source'
        },
        get playground() {
          playgroundReads += 1
          return true
        },
        get controls() {
          controlsReads += 1
          return PLAYGROUND_CONTROLS
        },
      }),
    )

    await Promise.resolve()
    expect(screen.getByTestId('preview').textContent).toBe('Ready')
    expect(componentReads).toBe(1)
    expect(sourceReads).toBe(1)
    expect(playgroundReads).toBe(1)
    expect(controlsReads).toBe(1)
  })
})
