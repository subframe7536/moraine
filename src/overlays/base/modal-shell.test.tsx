import { fireEvent, render } from '@solidjs/testing-library'
import { createComponent, createSignal } from 'solid-js'
import { describe, expect, test } from 'vitest'

import { createDesign } from '../../design.ts'
import { MoraineProvider } from '../../shared/provider/index.ts'
import { Dialog } from '../dialog/dialog.tsx'
import { Sheet } from '../sheet/sheet.tsx'

describe.each([
  { name: 'Dialog', Root: Dialog },
  { name: 'Sheet', Root: Sheet },
])('$name composition', ({ Root, name }) => {
  test('does not instantiate closed content slots and reads children once on opening', () => {
    let titleReads = 0
    let bodyReads = 0
    let childrenReads = 0
    const screen = render(() => (
      <Root>
        <Root.Trigger>Open</Root.Trigger>
        {createComponent(Root.Content, {
          get title() {
            titleReads += 1
            return <span>Title</span>
          },
          get body() {
            bodyReads += 1
            return undefined
          },
          get children() {
            childrenReads += 1
            return <span>Children</span>
          },
        })}
      </Root>
    ))
    expect([titleReads, bodyReads, childrenReads]).toEqual([0, 0, 0])
    expect(screen.container.children).toHaveLength(1)
    fireEvent.click(screen.getByRole('button', { name: 'Open' }))
    expect([titleReads, bodyReads, childrenReads]).toEqual([1, 1, 1])
    const content = document.body.querySelector('[data-slot="content"]')!
    expect(content.querySelector('[data-slot="body"]')?.textContent).toBe('Children')
    expect(content.querySelector('[data-slot="title"]')?.textContent).toBe('Title')
  })

  test.each([null, false])('explicit body %s suppresses children without reading them', (body) => {
    let reads = 0
    render(() => (
      <Root defaultOpen>
        {createComponent(Root.Content, {
          body,
          get children() {
            reads += 1
            return <span>Unused children</span>
          },
        })}
      </Root>
    ))
    expect(reads).toBe(0)
    expect(document.body.querySelector('[data-slot="body"]')).toBeNull()
  })

  test('renders every owned slot unstyled without a provider', () => {
    render(() => (
      <Root defaultOpen>
        <Root.Trigger>Open</Root.Trigger>
        <Root.Content title="Title" description="Description" body="Body" footer="Footer" />
      </Root>
    ))
    const slots = [
      'trigger',
      'overlay',
      'content',
      'header',
      'wrapper',
      'title',
      'description',
      'close',
      'body',
      'footer',
    ]
    const selector = slots.map((slot) => `[data-slot="${slot}"]`).join(',')
    for (const element of document.body.querySelectorAll<HTMLElement>(selector)) {
      expect(element.className).toBe('')
      expect(element.getAttribute('style')).toBeNull()
    }
  })

  test('replaces Design while preserving content identity and focus', () => {
    const key = name === 'Dialog' ? 'dialog' : 'sheet'
    const [design, setDesign] = createSignal(
      createDesign({
        preset: false,
        [key]: { base: { content: 'first-content' } },
      }),
    )
    render(() => (
      <MoraineProvider design={design()}>
        <Root defaultOpen>
          <Root.Content title="Title" body="Body" />
        </Root>
      </MoraineProvider>
    ))
    const content = document.body.querySelector<HTMLElement>('[data-slot="content"]')!
    content.focus()
    setDesign(createDesign({ preset: false, [key]: { base: { content: 'next-content' } } }))
    expect(document.body.querySelector('[data-slot="content"]')).toBe(content)
    expect(content.className).toBe('next-content')
    expect(document.activeElement).toBe(content)
  })
})
