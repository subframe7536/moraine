import { fireEvent, render, waitFor, within } from '@solidjs/testing-library'
import { createComponent, createSignal } from 'solid-js'
import { describe, expect, test, vi } from 'vitest'

import { createDesign } from '../../design.ts'
import { MoraineProvider } from '../../shared/provider/index.ts'
import { ContextMenu } from '../context-menu/context-menu.tsx'
import { DropdownMenu } from '../dropdown-menu/dropdown-menu.tsx'
import { Popover } from '../popover/popover.tsx'
import { Tooltip } from '../tooltip/tooltip.tsx'

describe.each([
  { name: 'Popover', Root: Popover },
  { name: 'Tooltip', Root: Tooltip },
])('$name DOM ownership', ({ Root }) => {
  test('creates closed content only on opening and reads each children getter once', async () => {
    let triggerReads = 0
    let contentReads = 0
    const [open, setOpen] = createSignal(false)
    const view = render(() => (
      <Root open={open()}>
        {createComponent(Root.Trigger, {
          get children() {
            triggerReads++
            return <span>Trigger</span>
          },
        })}
        {createComponent(Root.Content, {
          get children() {
            contentReads++
            return <span>Body</span>
          },
        })}
      </Root>
    ))
    expect([triggerReads, contentReads]).toEqual([1, 0])
    expect(view.container.children).toHaveLength(1)
    setOpen(true)
    await waitFor(() => expect(within(document.body).getByText('Body')).toBeTruthy())
    expect([triggerReads, contentReads]).toEqual([1, 1])
    for (const slot of ['trigger', 'content', 'body', 'text']) {
      for (const element of document.querySelectorAll<HTMLElement>(`[data-slot="${slot}"]`)) {
        expect(element.className).toBe('')
      }
    }
  })

  test('forwards cancellable content events and clears consumer refs', async () => {
    const ref = vi.fn()
    const changes = vi.fn()
    const view = render(() => (
      <Root defaultOpen onOpenChange={changes}>
        <Root.Trigger>Trigger</Root.Trigger>
        <Root.Content ref={ref} onKeyDown={(event: KeyboardEvent) => event.preventDefault()}>
          Body
        </Root.Content>
      </Root>
    ))
    await waitFor(() => expect(ref).toHaveBeenCalled())
    const surface = document.querySelector<HTMLElement>('[data-slot="content"]')!
    fireEvent.keyDown(surface, { key: 'Escape' })
    expect(changes).not.toHaveBeenCalled()
    view.unmount()
    expect(ref).toHaveBeenLastCalledWith(undefined)
  })
})

describe.each([
  { name: 'DropdownMenu', Root: DropdownMenu },
  { name: 'ContextMenu', Root: ContextMenu },
])('$name Design ownership', ({ name, Root }) => {
  test('keeps closed content lazy and preserves an open surface across Design replacement', async () => {
    let reads = 0
    const key = name === 'DropdownMenu' ? 'dropdownMenu' : 'contextMenu'
    const [design, setDesign] = createSignal(createDesign({ preset: false }))
    const [open, setOpen] = createSignal(false)
    const top = vi.fn(() => <span>Menu header</span>)
    render(() => (
      <MoraineProvider design={design()}>
        <Root open={open()}>
          <Root.Trigger>Trigger</Root.Trigger>
          {createComponent(Root.Content, {
            items: [{ label: 'Action' }],
            get contentTop() {
              reads++
              return top
            },
          })}
        </Root>
      </MoraineProvider>
    ))
    expect(reads).toBe(0)
    expect(top).not.toHaveBeenCalled()
    setOpen(true)
    await waitFor(() => expect(within(document.body).getByRole('menu')).toBeTruthy())
    expect(reads).toBe(1)
    expect(top).toHaveBeenCalledTimes(1)
    const content = within(document.body).getByRole('menu')
    expect(content.className).toBe('')
    setDesign(createDesign({ preset: false, [key]: { base: { content: 'bg-red-500' } } }))
    expect(within(document.body).getByRole('menu')).toBe(content)
    expect(content.className).toContain('bg-red-500')
    expect(top).toHaveBeenCalledTimes(1)
  })
})
