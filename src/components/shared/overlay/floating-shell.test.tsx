import { fireEvent, render, waitFor, within } from '@solidjs/testing-library'
import { createComponent, createSignal } from 'solid-js'
import { describe, expect, test, vi } from 'vitest'

import { MoraineProvider } from '../../../provider'
import { defineTheme } from '../../../theme'
import { ContextMenu } from '../../context-menu/context-menu'
import { DropdownMenu } from '../../dropdown-menu/dropdown-menu'
import { Popover } from '../../popover/popover'
import { Tooltip } from '../../tooltip/tooltip'

describe.each([
  { name: 'Popover', Root: Popover },
  { name: 'Tooltip', Root: Tooltip },
])('$name DOM ownership', ({ Root, name }) => {
  test('does not mount content until the overlay opens', async () => {
    const [open, setOpen] = createSignal(false)
    const view = render(() => (
      <Root open={open()}>
        <Root.Trigger>Trigger</Root.Trigger>
        <Root.Content>
          <span>Body</span>
        </Root.Content>
      </Root>
    ))
    expect(view.container.children).toHaveLength(1)
    expect(document.body.querySelector(`[data-slot="${name.toLowerCase()}-content"]`)).toBeNull()
    setOpen(true)
    await waitFor(() => expect(within(document.body).getByText('Body')).toBeTruthy())
  })

  test('forwards cancellable content events and forwards consumer refs', async () => {
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
    const surface = document.querySelector<HTMLElement>(
      `[data-slot="${name.toLowerCase()}-content"]`,
    )!
    fireEvent.keyDown(surface, { key: 'Escape' })
    expect(changes).not.toHaveBeenCalled()
    view.unmount()
    expect(ref).toHaveBeenCalledTimes(1)
  })
})

describe.each([
  { name: 'DropdownMenu', Root: DropdownMenu },
  { name: 'ContextMenu', Root: ContextMenu },
])('$name Design ownership', ({ name, Root }) => {
  test('shows menu header only while open and keeps the open menu across Design changes', async () => {
    const key = name === 'DropdownMenu' ? 'dropdownMenu' : 'contextMenu'
    const [design, setDesign] = createSignal(defineTheme({}))
    const [open, setOpen] = createSignal(false)
    const top = () => <span>Menu header</span>
    render(() => (
      <MoraineProvider theme={design()}>
        <Root open={open()}>
          <Root.Trigger>Trigger</Root.Trigger>
          {createComponent(Root.Content, {
            items: [{ label: 'Action' }],
            topRender: top,
          })}
        </Root>
      </MoraineProvider>
    ))
    expect(document.body.textContent).not.toContain('Menu header')
    setOpen(true)
    await waitFor(() => expect(within(document.body).getByRole('menu')).toBeTruthy())
    expect(within(document.body).getByText('Menu header')).toBeTruthy()
    const content = within(document.body).getByRole('menu')
    setDesign(defineTheme({ [key]: { base: { content: 'design-menu-content' } } }))
    expect(within(document.body).getByRole('menu')).toBe(content)
    expect(content.className).toContain('design-menu-content')
    expect(within(document.body).getByText('Menu header')).toBeTruthy()
  })
})
