import { fireEvent, render, waitFor } from '@solidjs/testing-library'
import { createSignal } from 'solid-js'
import { describe, expect, test, vi } from 'vitest'

import { callHandler } from '../../shared/utils'
import { expectNoPlacementMotion, finishMenuExitMotion } from '../../test-utils/overlay-test'

import { ContextMenu } from './context-menu'

describe('ContextMenu', () => {
  test('renders a div trigger root by default', () => {
    render(() => (
      <ContextMenu items={[{ label: 'Open item' }]}>
        {(props) => <div {...props}>Row Item</div>}
      </ContextMenu>
    ))

    const trigger = document.body.querySelector('[data-slot="trigger"]') as HTMLElement
    expect(trigger.tagName).toBe('DIV')
    expect(trigger.getAttribute('tabindex')).toBe('0')
    expect(trigger.querySelector('button')).toBeNull()
  })

  test('uses explicit id as id base', async () => {
    const screen = render(() => (
      <ContextMenu id="custom-menu" items={[{ label: 'Open item' }]}>
        {(props) => <div {...props}>Row Item</div>}
      </ContextMenu>
    ))

    fireEvent.contextMenu(screen.getByText('Row Item'), { clientX: 12, clientY: 18 })

    await waitFor(() => {
      expect(document.body.querySelector('[data-slot="content"]')).not.toBeNull()
    })

    const ids = Array.from(document.querySelectorAll('[id]')).map((element) => element.id)
    expect(ids.some((id) => id.startsWith('custom-menu'))).toBe(true)
  })

  test('changes root transition direction when placement flips to the left', async () => {
    const [placement, setPlacement] = createSignal<'right-start' | 'left-start'>('right-start')
    let initialContent: HTMLElement | null = null

    render(() => (
      <ContextMenu placement={placement()} defaultOpen items={[{ label: 'Open item' }]}>
        {(props) => <div {...props}>Row Item</div>}
      </ContextMenu>
    ))

    await waitFor(() => {
      const content = document.body.querySelector<HTMLElement>('[data-slot="content"]')
      expect(content).not.toBeNull()
      initialContent = content
      expect(content?.getAttribute('data-placement')).toBeNull()
      expect(content?.getAttribute('data-motion')).toBeNull()
      expect(content?.getAttribute('data-side')).toBe('right')
      expect(content?.getAttribute('data-align')).toBe('start')
      expect(content?.className).toContain('animate-menu-side-right')
      expectNoPlacementMotion(content)
      expect(content?.style.getPropertyValue('--mo-popper-content-transform-origin')).toBe(
        'left top',
      )
    })

    setPlacement('left-start')

    await waitFor(() => {
      const content = document.body.querySelector<HTMLElement>('[data-slot="content"]')
      expect(content?.getAttribute('data-placement')).toBeNull()
      expect(content?.getAttribute('data-motion')).toBeNull()
      expect(content).toBe(initialContent)
      expect(content?.getAttribute('data-side')).toBe('left')
      expect(content?.getAttribute('data-align')).toBe('start')
      expect(content?.className).toContain('animate-menu-side-left')
      expectNoPlacementMotion(content)
      expect(content?.style.getPropertyValue('--mo-popper-content-transform-origin')).toBe(
        'right top',
      )
    })
  })

  test('generates contextmenu-prefixed id when id prop is missing', async () => {
    const screen = render(() => (
      <ContextMenu items={[{ label: 'Open item' }]}>
        {(props) => <div {...props}>Row Item</div>}
      </ContextMenu>
    ))

    fireEvent.contextMenu(screen.getByText('Row Item'), { clientX: 12, clientY: 18 })

    await waitFor(() => {
      expect(document.body.querySelector('[data-slot="content"]')).not.toBeNull()
    })

    const ids = Array.from(document.querySelectorAll('[id]')).map((element) => element.id)
    expect(ids.some((id) => id.startsWith('contextmenu-'))).toBe(true)
  })

  test('opens on context menu event and supports keyboard selection', async () => {
    const onSelect = vi.fn()

    const screen = render(() => (
      <ContextMenu
        items={[
          { label: 'Rename', onSelect },
          { label: 'Delete', color: 'destructive' },
        ]}
      >
        {(props) => <div {...props}>Row Item</div>}
      </ContextMenu>
    ))

    fireEvent.contextMenu(screen.getByText('Row Item'), { clientX: 12, clientY: 18 })

    await waitFor(() => {
      expect(document.body.querySelectorAll('[data-slot="item"]').length).toBeGreaterThan(0)
    })

    const content = document.body.querySelector('[data-slot="content"]') as HTMLElement
    fireEvent.keyDown(content, { key: 'ArrowDown' })

    const highlighted = document.body.querySelector('[data-slot="item"][data-highlighted]')
    expect(highlighted).not.toBeNull()

    fireEvent.keyDown(highlighted!, { key: 'Enter' })
    expect(onSelect).toHaveBeenCalledTimes(1)
  })

  test('opens from keyboard context menu shortcut at trigger center', async () => {
    const screen = render(() => (
      <ContextMenu items={[{ label: 'Keyboard action' }, { label: 'Second action' }]}>
        {(props) => (
          <button {...props} type="button">
            Row Item
          </button>
        )}
      </ContextMenu>
    ))

    const trigger = screen.getByText('Row Item').closest('[data-slot="trigger"]') as HTMLElement
    trigger.getBoundingClientRect = () => ({
      bottom: 40,
      height: 20,
      left: 10,
      right: 110,
      top: 20,
      width: 100,
      x: 10,
      y: 20,
      toJSON: () => ({}),
    })

    fireEvent.keyDown(screen.getByText('Row Item'), { key: 'F10', shiftKey: true })

    await waitFor(() => {
      const highlighted = document.body.querySelector('[data-slot="item"][data-highlighted]')
      expect(highlighted?.textContent).toContain('Keyboard action')
    })
  })

  test('exposes trigger data state while opened, closed, and disabled', async () => {
    const screen = render(() => (
      <ContextMenu disabled items={[{ label: 'Disabled action' }]}>
        {(props) => <div {...props}>Row Item</div>}
      </ContextMenu>
    ))

    const trigger = screen.getByText('Row Item').closest('[data-slot="trigger"]') as HTMLElement

    expect(trigger.getAttribute('data-disabled')).toBe('')
    expect(trigger.getAttribute('data-closed')).toBe('')
    expect(trigger.hasAttribute('data-expanded')).toBe(false)

    screen.unmount()

    const enabledScreen = render(() => (
      <ContextMenu items={[{ label: 'Open item' }]}>
        {(props) => <div {...props}>Enabled Row</div>}
      </ContextMenu>
    ))

    const enabledTrigger = enabledScreen
      .getByText('Enabled Row')
      .closest('[data-slot="trigger"]') as HTMLElement

    expect(enabledTrigger.hasAttribute('data-disabled')).toBe(false)
    expect(enabledTrigger.getAttribute('data-closed')).toBe('')
    expect(enabledTrigger.hasAttribute('data-expanded')).toBe(false)

    fireEvent.contextMenu(enabledScreen.getByText('Enabled Row'), {
      clientX: 12,
      clientY: 18,
    })

    await waitFor(() => {
      expect(enabledTrigger.getAttribute('data-expanded')).toBe('')
      expect(enabledTrigger.hasAttribute('data-closed')).toBe(false)
    })
  })

  test('allows callers to override generated trigger ARIA attributes', () => {
    const screen = render(() => (
      <ContextMenu items={[]}>
        {(props) => (
          <div
            {...props}
            aria-controls="caller-content"
            aria-expanded={'caller-expanded' as unknown as 'true'}
            aria-haspopup={'caller-menu' as unknown as 'menu'}
          >
            Row Item
          </div>
        )}
      </ContextMenu>
    ))
    const trigger = screen.getByText('Row Item').closest('[data-slot="trigger"]')

    expect(trigger?.getAttribute('aria-controls')).toBe('caller-content')
    expect(trigger?.getAttribute('aria-expanded')).toBe('caller-expanded')
    expect(trigger?.getAttribute('aria-haspopup')).toBe('caller-menu')
  })

  test('exposes disabled semantics for native and non-native triggers with caller overrides', () => {
    render(() => (
      <>
        <ContextMenu disabled items={[]}>
          {(props) => <div {...props}>Disabled div</div>}
        </ContextMenu>
        <ContextMenu disabled items={[]}>
          {(props) => (
            <button {...props} type="button">
              Disabled button
            </button>
          )}
        </ContextMenu>
        <ContextMenu disabled items={[]}>
          {(props) => (
            <div {...props} aria-disabled="false" tabIndex={2}>
              Overridden div
            </div>
          )}
        </ContextMenu>
      </>
    ))

    const disabledDiv = document.body.querySelectorAll('[data-slot="trigger"]')[0] as HTMLElement
    const button = document.body.querySelector('button') as HTMLButtonElement
    const overriddenDiv = document.body.querySelectorAll('[data-slot="trigger"]')[2] as HTMLElement

    expect(disabledDiv.hasAttribute('disabled')).toBe(false)
    expect(disabledDiv.getAttribute('aria-disabled')).toBe('true')
    expect(disabledDiv.tabIndex).toBe(-1)
    expect(button.disabled).toBe(true)
    expect(button.hasAttribute('aria-disabled')).toBe(false)
    expect(button.hasAttribute('tabindex')).toBe(false)
    expect(overriddenDiv.getAttribute('aria-disabled')).toBe('false')
    expect(overriddenDiv.tabIndex).toBe(2)
  })

  test('calls the trigger contextmenu handler for native right-clicks', async () => {
    const onContextMenu = vi.fn((event: MouseEvent) => event.preventDefault())
    const onOpenChange = vi.fn()
    const screen = render(() => (
      <ContextMenu onOpenChange={onOpenChange} items={[]}>
        {(props) => (
          <div {...props} onContextMenu={onContextMenu}>
            Row Item
          </div>
        )}
      </ContextMenu>
    ))

    fireEvent.contextMenu(screen.getByText('Row Item'))

    expect(onContextMenu).toHaveBeenCalledTimes(1)
    expect(onOpenChange).not.toHaveBeenCalled()
  })

  test('clears a touch long press when contextmenu is prevented', async () => {
    vi.useFakeTimers()

    try {
      const onOpenChange = vi.fn()
      const screen = render(() => (
        <ContextMenu onOpenChange={onOpenChange} items={[{ label: 'Touch action' }]}>
          {(props) => (
            <div
              {...props}
              onContextMenu={(event) => {
                event.preventDefault()
                props.onContextMenu?.(event)
              }}
            >
              Row Item
            </div>
          )}
        </ContextMenu>
      ))

      const row = screen.getByText('Row Item')
      fireEvent.pointerDown(row, {
        pointerType: 'touch',
        clientX: 21,
        clientY: 34,
      })
      await vi.advanceTimersByTimeAsync(699)
      fireEvent.contextMenu(row)
      await vi.advanceTimersByTimeAsync(1)

      expect(onOpenChange).not.toHaveBeenCalled()
      expect(document.body.querySelector('[data-slot="content"]')).toBeNull()
    } finally {
      vi.useRealTimers()
    }
  })

  test('focuses content on open, supports typeahead, and restores trigger wrapper focus on escape', async () => {
    const triggerRef = vi.fn()
    const screen = render(() => (
      <ContextMenu items={[{ label: 'Archive' }, { label: 'Duplicate' }, { label: 'Delete' }]}>
        {(props) => (
          <div
            {...props}
            ref={(element) => {
              props.ref(element)
              triggerRef(element)
            }}
          >
            Row Item
          </div>
        )}
      </ContextMenu>
    ))

    const row = screen.getByText('Row Item')
    expect(triggerRef).toHaveBeenCalledWith(row)

    fireEvent.contextMenu(row, { clientX: 12, clientY: 18 })

    await waitFor(() => {
      const content = document.body.querySelector('[data-slot="content"]')
      expect(content).not.toBeNull()
      expect(document.activeElement).toBe(content)
    })

    const content = document.body.querySelector('[data-slot="content"]') as HTMLElement
    fireEvent.keyDown(content, { key: 'd' })

    expect(
      document.body.querySelector('[data-slot="item"][data-highlighted]')?.textContent,
    ).toContain('Duplicate')

    fireEvent.keyDown(content, { key: 'Escape' })
    await finishMenuExitMotion()

    await waitFor(() => {
      expect(document.activeElement).toBe(row.closest('[data-slot="trigger"]'))
    })
  })

  test('does not open on left click', async () => {
    const screen = render(() => (
      <ContextMenu items={[{ label: 'Open by right click only' }]}>
        {(props) => <div {...props}>Row Item</div>}
      </ContextMenu>
    ))

    fireEvent.click(screen.getByText('Row Item'))

    await waitFor(() => {
      expect(document.body.querySelector('[data-slot="content"]')).toBeNull()
    })
  })

  test('fires onOpenChange when opened and blocks opening when disabled', async () => {
    const onOpenChange = vi.fn()

    const enabledScreen = render(() => (
      <ContextMenu onOpenChange={onOpenChange} items={[{ label: 'Enabled action' }]}>
        {(props) => (
          <div {...props} data-testid="enabled-row">
            Enabled Row
          </div>
        )}
      </ContextMenu>
    ))

    fireEvent.contextMenu(enabledScreen.getByTestId('enabled-row'), {
      clientX: 12,
      clientY: 18,
    })

    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(true)
      expect(document.body.querySelector('[data-slot="content"]')).not.toBeNull()
    })

    enabledScreen.unmount()

    const disabledOnOpenChange = vi.fn()
    const disabledScreen = render(() => (
      <ContextMenu
        disabled
        onOpenChange={disabledOnOpenChange}
        items={[{ label: 'Disabled action' }]}
      >
        {(props) => (
          <div {...props} data-testid="disabled-row">
            Disabled Row
          </div>
        )}
      </ContextMenu>
    ))

    fireEvent.contextMenu(disabledScreen.getByTestId('disabled-row'), {
      clientX: 24,
      clientY: 32,
    })

    await waitFor(() => {
      expect(document.body.querySelector('[data-slot="content"]')).toBeNull()
    })

    expect(disabledOnOpenChange).not.toHaveBeenCalled()
    disabledScreen.unmount()
  })

  test('supports controlled open state and reports right-click open attempts', async () => {
    const onOpenChange = vi.fn()

    const screen = render(() => (
      <ContextMenu open={false} onOpenChange={onOpenChange} items={[{ label: 'Controlled item' }]}>
        {(props) => <div {...props}>Row Item</div>}
      </ContextMenu>
    ))

    fireEvent.contextMenu(screen.getByText('Row Item'), { clientX: 12, clientY: 18 })

    await waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(true)
      expect(document.body.querySelector('[data-slot="content"]')).toBeNull()
    })
  })

  test('supports defaultOpen without anchor coordinates', async () => {
    render(() => (
      <ContextMenu defaultOpen items={[{ label: 'Default open item' }]}>
        {(props) => <div {...props}>Row Item</div>}
      </ContextMenu>
    ))

    await waitFor(() => {
      expect(document.body.querySelector('[data-slot="content"]')).not.toBeNull()
      expect(document.body.textContent).toContain('Default open item')
    })

    const content = document.body.querySelector('[data-slot="content"]') as HTMLElement

    expect(content.className).toContain('ml-$mo-popper-content-overflow-padding')
    expect(content.className).toContain('data-expanded:animate-menu-in')
    expect(content.className).toContain('data-closed:animate-menu-out')
    expect(content.getAttribute('data-motion')).toBeNull()
    expect(content.getAttribute('data-align')).toBe('start')
    expect(content.className).toContain('animate-menu-side-right')
    expect(content.className).toContain('origin-$mo-popper-content-transform-origin')

    await waitFor(() => {
      expect(content.style.getPropertyValue('--mo-popper-content-transform-origin')).toBe(
        'left top',
      )
    })
  })

  test('uses a centered origin without a placement alignment', async () => {
    render(() => (
      <ContextMenu placement="bottom" defaultOpen items={[{ label: 'Centered item' }]}>
        {(props) => <div {...props}>Row Item</div>}
      </ContextMenu>
    ))

    const content = await waitFor(() => {
      const element = document.body.querySelector('[data-slot="content"]')
      expect(element).not.toBeNull()
      return element!
    })

    expect(content.getAttribute('data-side')).toBe('bottom')
    expect(content.getAttribute('data-align')).toBeNull()
    expect(content.className).toContain('animate-menu-side-bottom')
  })

  test('opens after 700ms touch long press', async () => {
    vi.useFakeTimers()

    try {
      const onOpenChange = vi.fn()
      const screen = render(() => (
        <ContextMenu onOpenChange={onOpenChange} items={[{ label: 'Touch action' }]}>
          {(props) => <div {...props}>Row Item</div>}
        </ContextMenu>
      ))

      fireEvent.pointerDown(screen.getByText('Row Item'), {
        pointerType: 'touch',
        clientX: 21,
        clientY: 34,
      })

      await vi.advanceTimersByTimeAsync(699)
      expect(onOpenChange).not.toHaveBeenCalled()

      await vi.advanceTimersByTimeAsync(1)
      expect(onOpenChange).toHaveBeenCalledWith(true)
      expect(document.body.querySelector('[data-slot="content"]')).not.toBeNull()
    } finally {
      vi.useRealTimers()
    }
  })

  test('cancels a pending long press when a second pointer joins the gesture', async () => {
    vi.useFakeTimers()

    try {
      const onOpenChange = vi.fn()
      const screen = render(() => (
        <ContextMenu onOpenChange={onOpenChange} items={[{ label: 'Touch action' }]}>
          {(props) => <div {...props}>Row Item</div>}
        </ContextMenu>
      ))
      const row = screen.getByText('Row Item')

      fireEvent.pointerDown(row, {
        pointerId: 1,
        pointerType: 'touch',
        clientX: 21,
        clientY: 34,
      })
      fireEvent.pointerDown(row, {
        pointerId: 2,
        pointerType: 'touch',
        clientX: 31,
        clientY: 34,
      })
      await vi.advanceTimersByTimeAsync(700)

      expect(onOpenChange).not.toHaveBeenCalled()
      expect(document.body.querySelector('[data-slot="content"]')).toBeNull()
    } finally {
      vi.useRealTimers()
    }
  })

  test('uses live controlled state and open handler when the long press completes', async () => {
    vi.useFakeTimers()

    try {
      const firstHandler = vi.fn()
      const secondHandler = vi.fn()
      const [controlledOpen, setControlledOpen] = createSignal<boolean | undefined>(undefined)
      const [onOpenChange, setOnOpenChange] = createSignal(firstHandler)
      const screen = render(() => (
        <ContextMenu
          open={controlledOpen()}
          onOpenChange={onOpenChange()}
          items={[{ label: 'Touch action' }]}
        >
          {(props) => <div {...props}>Row Item</div>}
        </ContextMenu>
      ))

      fireEvent.pointerDown(screen.getByText('Row Item'), {
        pointerId: 5,
        pointerType: 'touch',
        clientX: 21,
        clientY: 34,
      })
      setControlledOpen(false)
      setOnOpenChange(() => secondHandler)
      await vi.advanceTimersByTimeAsync(700)

      expect(firstHandler).not.toHaveBeenCalled()
      expect(secondHandler).toHaveBeenCalledTimes(1)
      expect(secondHandler).toHaveBeenCalledWith(true)
      expect(document.body.querySelector('[data-slot="content"]')).toBeNull()
    } finally {
      vi.useRealTimers()
    }
  })

  test('guards the completing long-press pointer but allows the next independent outside press', async () => {
    vi.useFakeTimers()

    try {
      const screen = render(() => (
        <ContextMenu items={[{ label: 'Touch action' }]}>
          {(props) => <div {...props}>Row Item</div>}
        </ContextMenu>
      ))

      fireEvent.pointerDown(screen.getByText('Row Item'), {
        pointerId: 7,
        pointerType: 'touch',
        clientX: 21,
        clientY: 34,
      })
      await vi.advanceTimersByTimeAsync(700)
      await vi.advanceTimersByTimeAsync(16)
      expect(document.body.querySelector('[data-slot="content"][data-expanded]')).not.toBeNull()

      const completingEvent = new PointerEvent('pointerdown', {
        bubbles: true,
        cancelable: true,
        pointerId: 7,
        pointerType: 'touch',
      })
      document.body.dispatchEvent(completingEvent)
      expect(completingEvent.defaultPrevented).toBe(true)
      expect(document.body.querySelector('[data-slot="content"][data-expanded]')).not.toBeNull()

      fireEvent.pointerDown(document.body, {
        pointerId: 8,
        pointerType: 'touch',
      })
      expect(document.body.querySelector('[data-slot="content"][data-closed]')).not.toBeNull()
    } finally {
      vi.useRealTimers()
    }
  })

  test('consumes only the matching follow-up contextmenu and expires stale suppression', async () => {
    vi.useFakeTimers()

    try {
      const onOpenChange = vi.fn()
      const screen = render(() => (
        <ContextMenu onOpenChange={onOpenChange} items={[{ label: 'Touch action' }]}>
          {(props) => <div {...props}>Row Item</div>}
        </ContextMenu>
      ))
      const row = screen.getByText('Row Item')

      fireEvent.pointerDown(row, {
        pointerId: 9,
        pointerType: 'touch',
        clientX: 21,
        clientY: 34,
      })
      await vi.advanceTimersByTimeAsync(700)
      fireEvent.contextMenu(row, { clientX: 21, clientY: 34 })
      fireEvent.pointerUp(row, { pointerId: 9, pointerType: 'touch' })
      await vi.advanceTimersByTimeAsync(16)
      expect(onOpenChange).toHaveBeenCalledTimes(1)
      expect(document.body.querySelector('[data-slot="content"][data-expanded]')).not.toBeNull()

      fireEvent.pointerDown(document.body, { pointerId: 10, pointerType: 'touch' })
      await finishMenuExitMotion()
      fireEvent.pointerDown(row, {
        pointerId: 11,
        pointerType: 'touch',
        clientX: 40,
        clientY: 50,
      })
      await vi.advanceTimersByTimeAsync(700)
      fireEvent.pointerUp(row, { pointerId: 11, pointerType: 'touch' })
      await vi.advanceTimersByTimeAsync(1_000)
      fireEvent.contextMenu(row, { clientX: 40, clientY: 50 })

      expect(onOpenChange.mock.calls.map(([open]) => open)).toEqual([true, false, true, false])
    } finally {
      vi.useRealTimers()
    }
  })

  test('does not consume a contextmenu from a different observable point', async () => {
    vi.useFakeTimers()

    try {
      const onOpenChange = vi.fn()
      const screen = render(() => (
        <ContextMenu onOpenChange={onOpenChange} items={[{ label: 'Touch action' }]}>
          {(props) => <div {...props}>Row Item</div>}
        </ContextMenu>
      ))
      const row = screen.getByText('Row Item')

      fireEvent.pointerDown(row, {
        pointerId: 12,
        pointerType: 'touch',
        clientX: 21,
        clientY: 34,
      })
      await vi.advanceTimersByTimeAsync(700)
      fireEvent.contextMenu(row, { clientX: 60, clientY: 70 })

      expect(onOpenChange.mock.calls.map(([open]) => open)).toEqual([true, false])
    } finally {
      vi.useRealTimers()
    }
  })

  test('does not open when disabled during a touch long press', async () => {
    vi.useFakeTimers()

    try {
      const [disabled, setDisabled] = createSignal(false)
      const onOpenChange = vi.fn()
      const screen = render(() => (
        <ContextMenu
          disabled={disabled()}
          onOpenChange={onOpenChange}
          items={[{ label: 'Touch action' }]}
        >
          {(props) => <div {...props}>Row Item</div>}
        </ContextMenu>
      ))

      const row = screen.getByText('Row Item')
      fireEvent.pointerDown(row, {
        pointerType: 'touch',
        clientX: 21,
        clientY: 34,
      })

      setDisabled(true)
      await vi.advanceTimersByTimeAsync(700)

      expect(onOpenChange).not.toHaveBeenCalled()
      expect(document.body.querySelector('[data-slot="content"]')).toBeNull()
    } finally {
      vi.useRealTimers()
    }
  })

  test('clears a touch long press when pointerup is prevented', async () => {
    vi.useFakeTimers()

    try {
      const onOpenChange = vi.fn()
      const screen = render(() => (
        <ContextMenu onOpenChange={onOpenChange} items={[{ label: 'Touch action' }]}>
          {(props) => (
            <div
              {...props}
              onPointerUp={(event) => {
                event.preventDefault()
                callHandler(event, props.onPointerUp)
              }}
            >
              Row Item
            </div>
          )}
        </ContextMenu>
      ))

      const row = screen.getByText('Row Item')
      fireEvent.pointerDown(row, {
        pointerType: 'touch',
        clientX: 21,
        clientY: 34,
      })
      fireEvent.pointerUp(row, {
        pointerType: 'touch',
        cancelable: true,
      })

      await vi.advanceTimersByTimeAsync(700)

      expect(onOpenChange).not.toHaveBeenCalled()
    } finally {
      vi.useRealTimers()
    }
  })

  test('keeps long press active through small touch movement', async () => {
    vi.useFakeTimers()

    try {
      const onOpenChange = vi.fn()
      const screen = render(() => (
        <ContextMenu onOpenChange={onOpenChange} items={[{ label: 'Touch action' }]}>
          {(props) => <div {...props}>Row Item</div>}
        </ContextMenu>
      ))

      const row = screen.getByText('Row Item')
      fireEvent.pointerDown(row, {
        pointerType: 'touch',
        clientX: 21,
        clientY: 34,
      })
      fireEvent.pointerMove(row, {
        pointerType: 'touch',
        clientX: 26,
        clientY: 37,
      })

      await vi.advanceTimersByTimeAsync(700)

      expect(onOpenChange).toHaveBeenCalledWith(true)
      expect(document.body.querySelector('[data-slot="content"]')).not.toBeNull()
    } finally {
      vi.useRealTimers()
    }
  })

  test('cancels touch long press after movement exceeds tolerance', async () => {
    vi.useFakeTimers()

    try {
      const onOpenChange = vi.fn()
      const screen = render(() => (
        <ContextMenu onOpenChange={onOpenChange} items={[{ label: 'Touch action' }]}>
          {(props) => <div {...props}>Row Item</div>}
        </ContextMenu>
      ))

      const row = screen.getByText('Row Item')
      fireEvent.pointerDown(row, {
        pointerType: 'touch',
        clientX: 21,
        clientY: 34,
      })
      fireEvent.pointerMove(row, {
        pointerType: 'touch',
        clientX: 40,
        clientY: 34,
      })

      await vi.advanceTimersByTimeAsync(700)

      expect(onOpenChange).not.toHaveBeenCalled()
      expect(document.body.querySelector('[data-slot="content"]')).toBeNull()
    } finally {
      vi.useRealTimers()
    }
  })

  test('dismisses menu when right-clicking opened menu content', async () => {
    const screen = render(() => (
      <ContextMenu items={[{ label: 'Pinned action' }]}>
        {(props) => <div {...props}>Row Item</div>}
      </ContextMenu>
    ))

    fireEvent.contextMenu(screen.getByText('Row Item'), { clientX: 12, clientY: 18 })

    await waitFor(() => {
      expect(document.body.querySelector('[data-slot="content"]')).not.toBeNull()
    })

    const content = document.body.querySelector('[data-slot="content"]') as HTMLElement
    const event = new MouseEvent('contextmenu', {
      bubbles: true,
      cancelable: true,
      clientX: 18,
      clientY: 24,
    })
    const notCanceled = content.dispatchEvent(event)

    expect(notCanceled).toBe(false)
    expect(event.defaultPrevented).toBe(true)
    expect(
      screen.getByText('Row Item').closest('[data-slot="trigger"]')?.getAttribute('aria-expanded'),
    ).toBe('false')
    expect(document.body.querySelector('[data-slot="content"][data-expanded]')).toBeNull()
    const exitingContent = document.body.querySelector('[data-slot="content"][data-closed]')
    expect(exitingContent).not.toBeNull()
    expect(exitingContent?.className).toContain('data-closed:animate-menu-out')

    const positioner = exitingContent?.closest('[data-slot="positioner"]') as HTMLElement
    expect(positioner.style.visibility).toBe('visible')

    await finishMenuExitMotion()

    expect(document.body.querySelector('[data-slot="content"]')).toBeNull()
    expect(positioner.isConnected).toBe(false)
  })

  test('dismisses menu when right-clicking trigger again while open', async () => {
    const screen = render(() => (
      <ContextMenu items={[{ label: 'Pinned action' }]}>
        {(props) => <div {...props}>Row Item</div>}
      </ContextMenu>
    ))

    const row = screen.getByText('Row Item')

    fireEvent.contextMenu(row, { clientX: 12, clientY: 18 })

    await waitFor(() => {
      expect(document.body.querySelector('[data-slot="content"]')).not.toBeNull()
    })

    const event = new MouseEvent('contextmenu', {
      bubbles: true,
      cancelable: true,
      clientX: 16,
      clientY: 22,
    })
    const notCanceled = row.dispatchEvent(event)

    expect(notCanceled).toBe(false)
    expect(event.defaultPrevented).toBe(true)
    expect(row.closest('[data-slot="trigger"]')?.getAttribute('aria-expanded')).toBe('false')
    expect(document.body.querySelector('[data-slot="content"][data-expanded]')).toBeNull()
    expect(document.body.querySelector('[data-slot="content"][data-closed]')).not.toBeNull()

    await finishMenuExitMotion()

    expect(document.body.querySelector('[data-slot="content"]')).toBeNull()
  })

  test('dismisses menu when pressing the trigger again with a different pointer button', async () => {
    const screen = render(() => (
      <ContextMenu items={[{ label: 'Pinned action' }]}>
        {(props) => <div {...props}>Row Item</div>}
      </ContextMenu>
    ))

    const row = screen.getByText('Row Item')

    fireEvent.contextMenu(row, { clientX: 12, clientY: 18 })

    await waitFor(() => {
      expect(document.body.querySelector('[data-slot="content"]')).not.toBeNull()
    })

    fireEvent.pointerDown(row, { button: 0, pointerType: 'mouse' })

    expect(row.closest('[data-slot="trigger"]')?.getAttribute('aria-expanded')).toBe('false')
    expect(document.body.querySelector('[data-slot="content"][data-expanded]')).toBeNull()
    expect(document.body.querySelector('[data-slot="content"][data-closed]')).not.toBeNull()

    await finishMenuExitMotion()

    expect(document.body.querySelector('[data-slot="content"]')).toBeNull()
  })

  test('locks body scroll and renders an overlay layer while open', async () => {
    const screen = render(() => (
      <ContextMenu items={[{ label: 'Pinned action' }]}>
        {(props) => <div {...props}>Row Item</div>}
      </ContextMenu>
    ))

    fireEvent.contextMenu(screen.getByText('Row Item'), { clientX: 12, clientY: 18 })

    await waitFor(() => {
      expect(document.body.querySelector('[data-slot="overlay"]')).not.toBeNull()
    })

    expect(document.body.style.overflow).toBe('hidden')

    const overlay = document.body.querySelector('[data-slot="overlay"]') as HTMLElement
    fireEvent.pointerDown(overlay, { pointerType: 'mouse' })
    await finishMenuExitMotion()

    expect(document.body.querySelector('[data-slot="overlay"]')).toBeNull()
    expect(document.body.style.overflow).toBe('')
  })

  test('renders item matrix, nested submenu, and content slots', async () => {
    const contentTop = vi.fn((props: { sub: boolean }) => (
      <div data-testid={props.sub ? 'content-top-sub' : 'content-top-root'}>
        {props.sub ? 'Top Sub' : 'Top Root'}
      </div>
    ))
    const contentBottom = vi.fn((props: { sub: boolean }) => (
      <div data-testid={props.sub ? 'content-bottom-sub' : 'content-bottom-root'}>
        {props.sub ? 'Bottom Sub' : 'Bottom Root'}
      </div>
    ))

    const screen = render(() => (
      <ContextMenu
        placement="bottom-start"
        classes={{
          content: 'content-class',
        }}
        contentTop={contentTop}
        contentBottom={contentBottom}
        items={[
          {
            type: 'group',
            label: 'Account',
            children: [
              { type: 'separator' },
              {
                label: 'Profile',
                description: 'View profile',
                icon: 'icon-user',
                kbds: ['meta', 'p'],
              },
              {
                label: 'Avatar row',
                icon: <span data-testid="avatar-node">A</span>,
              },
              {
                type: 'checkbox',
                label: 'Pinned',
                checked: true,
              },
              {
                label: 'More',
                defaultOpen: true,
                children: [{ label: 'Nested action' }],
              },
            ],
          },
        ]}
      >
        {(props) => <div {...props}>Row Item</div>}
      </ContextMenu>
    ))

    fireEvent.contextMenu(screen.getByText('Row Item'), { clientX: 12, clientY: 18 })

    await waitFor(() => {
      expect(document.body.textContent).toContain('Nested action')
    })

    const rootContent = document.body.querySelector<HTMLElement>('[data-slot="content"]')

    expect(document.body.textContent).toContain('Account')
    expect(document.body.querySelector('[data-slot="separator"]')).not.toBeNull()
    expect(document.body.textContent).toContain('View profile')
    expect(document.body.querySelectorAll('[data-slot="item"]').length).toBeGreaterThanOrEqual(2)
    expect(document.body.querySelector('[data-testid="avatar-node"]')).not.toBeNull()
    expect(document.body.querySelector('[data-slot="itemIndicator"]')).not.toBeNull()

    expect(rootContent?.className).toContain('mt-$mo-popper-content-overflow-padding')
    expect(rootContent?.className).toContain('surface-overlay')
    expect(rootContent?.className).toContain('data-expanded:animate-menu-in')
    expect(rootContent?.className).toContain('data-closed:animate-menu-out')
    expect(rootContent?.getAttribute('data-motion')).toBeNull()
    expect(rootContent?.getAttribute('data-align')).toBe('start')
    expect(rootContent?.className).toContain('animate-menu-side-bottom')
    expect(rootContent?.className).toContain('origin-$mo-popper-content-transform-origin')
    expect(rootContent?.className).toContain('content-class')

    expect(document.body.querySelector('[data-testid="content-top-root"]')).not.toBeNull()
    expect(document.body.querySelector('[data-testid="content-bottom-root"]')).not.toBeNull()
    expect(document.body.querySelector('[data-testid="content-top-sub"]')).not.toBeNull()
    expect(document.body.querySelector('[data-testid="content-bottom-sub"]')).not.toBeNull()

    expect(contentTop).toHaveBeenCalledWith({ sub: false })
    expect(contentTop).toHaveBeenCalledWith({ sub: true })
    expect(contentBottom).toHaveBeenCalledWith({ sub: false })
    expect(contentBottom).toHaveBeenCalledWith({ sub: true })
  })

  test('applies enter transition classes to an opened submenu', async () => {
    render(() => (
      <ContextMenu
        defaultOpen
        items={[
          {
            label: 'More',
            children: [{ label: 'Nested action' }],
          },
        ]}
      >
        {(props) => <div {...props}>Row Item</div>}
      </ContextMenu>
    ))

    const rootContent = document.body.querySelector('[data-slot="content"]') as HTMLElement
    await waitFor(() => {
      expect(rootContent.querySelector('[data-slot="item"]')).not.toBeNull()
    })

    const subTrigger = rootContent.querySelector('[data-slot="item"]') as HTMLElement
    fireEvent.keyDown(subTrigger, { key: 'ArrowRight' })

    const submenuContent = await waitFor(() => {
      const content = Array.from(document.body.querySelectorAll('[data-slot="content"]')).find(
        (element) => element.textContent?.includes('Nested action'),
      ) as HTMLElement | undefined

      expect(content).not.toBeNull()
      return content!
    })

    await waitFor(() => {
      expect(submenuContent.getAttribute('data-expanded')).toBe('')
    })
    expect(submenuContent.className).toContain('data-expanded:animate-menu-in')
    expect(submenuContent.getAttribute('data-motion')).toBeNull()
    expect(submenuContent.getAttribute('data-side')).toBe('right')
    expect(submenuContent.getAttribute('data-align')).toBe('start')
    expect(submenuContent.className).toContain('animate-menu-side-right')
    await waitFor(() => {
      expect(submenuContent.style.getPropertyValue('--mo-popper-content-transform-origin')).toBe(
        'left top',
      )
    })
  })

  test('applies enter transition classes to a mouse-opened submenu', async () => {
    vi.useFakeTimers()

    try {
      render(() => (
        <ContextMenu
          defaultOpen
          items={[
            {
              label: 'More',
              children: [{ label: 'Nested action' }],
            },
          ]}
        >
          {(props) => <div {...props}>Row Item</div>}
        </ContextMenu>
      ))

      const rootContent = document.body.querySelector('[data-slot="content"]') as HTMLElement
      const subTrigger = rootContent.querySelector('[data-slot="item"]') as HTMLElement
      fireEvent.pointerMove(subTrigger, { pointerType: 'mouse' })
      await vi.advanceTimersByTimeAsync(100)
      await vi.advanceTimersByTimeAsync(16)

      const submenuContent = await waitFor(() => {
        const content = Array.from(document.body.querySelectorAll('[data-slot="content"]')).find(
          (element) => element.textContent?.includes('Nested action'),
        ) as HTMLElement | undefined

        expect(content).not.toBeNull()
        return content!
      })

      expect(submenuContent.getAttribute('data-expanded')).toBe('')
      expect(submenuContent.getAttribute('data-motion')).toBeNull()
      expect(submenuContent.getAttribute('data-side')).toBe('right')
      expect(submenuContent.getAttribute('data-align')).toBe('start')
      expect(submenuContent.className).toContain('animate-menu-side-right')
      await waitFor(() => {
        expect(submenuContent.style.getPropertyValue('--mo-popper-content-transform-origin')).toBe(
          'left top',
        )
      })
    } finally {
      vi.useRealTimers()
    }
  })

  test('keeps nested submenus mounted through recursive exit motion', async () => {
    const closeOrder: string[] = []
    const originalSetAttribute = HTMLElement.prototype.setAttribute
    const setAttributeSpy = vi
      .spyOn(HTMLElement.prototype, 'setAttribute')
      .mockImplementation(function (this: HTMLElement, name: string, value: string) {
        if (name === 'data-closed' && value === '' && this.dataset.slot === 'content') {
          closeOrder.push(this.id)
        }

        return originalSetAttribute.call(this, name, value)
      })

    try {
      render(() => (
        <ContextMenu
          id="context-dismiss-order"
          defaultOpen
          items={[
            {
              label: 'More',
              defaultOpen: true,
              children: [
                {
                  label: 'Deep',
                  defaultOpen: true,
                  children: [{ label: 'Leaf action' }],
                },
              ],
            },
          ]}
        >
          {(props) => <div {...props}>Row Item</div>}
        </ContextMenu>
      ))

      await waitFor(() => {
        expect(document.body.querySelectorAll('[data-slot="content"]')).toHaveLength(3)
      })

      const contents = Array.from(document.body.querySelectorAll('[data-slot="content"]'))
      const [rootContent, middleContent, deepestContent] = contents as [
        HTMLElement,
        HTMLElement,
        HTMLElement,
      ]

      fireEvent.keyDown(rootContent, { key: 'Escape' })

      await waitFor(() => {
        expect(closeOrder).toEqual([deepestContent.id, middleContent.id, rootContent.id])
        expect(document.body.querySelectorAll('[data-slot="content"][data-closed]')).toHaveLength(3)
      })

      await finishMenuExitMotion()

      await waitFor(() => {
        expect(document.body.querySelectorAll('[data-slot="content"]')).toHaveLength(0)
      })
    } finally {
      setAttributeSpy.mockRestore()
    }
  })

  test('cancels submenu exit motion when the context menu reopens', async () => {
    const [open, setOpen] = createSignal(true)

    render(() => (
      <ContextMenu
        open={open()}
        onOpenChange={setOpen}
        items={[
          {
            label: 'More',
            defaultOpen: true,
            children: [{ label: 'Nested action' }],
          },
        ]}
      >
        {(props) => <div {...props}>Row Item</div>}
      </ContextMenu>
    ))

    await waitFor(() => {
      expect(document.body.querySelectorAll('[data-slot="content"]')).toHaveLength(2)
    })

    setOpen(false)

    await waitFor(() => {
      expect(document.body.querySelectorAll('[data-slot="content"][data-closed]')).toHaveLength(2)
    })

    setOpen(true)

    await waitFor(() => {
      expect(document.body.querySelectorAll('[data-slot="content"][data-expanded]')).toHaveLength(1)
      expect(document.body.querySelectorAll('[data-slot="content"][data-closed]')).toHaveLength(1)
    })

    const rootContent = document.body.querySelector('[data-slot="content"][data-expanded]')
    const rootPositioner = rootContent?.closest('[data-slot="positioner"]') as HTMLElement
    expect(rootPositioner.style.visibility).toBe('visible')
    expect(document.body.textContent).toContain('Nested action')
  })

  test('passes itemRender context for root and nested items', async () => {
    const itemRender = vi.fn((props: any) => (
      <span data-testid={`custom-${String(props.item.label)}-${props.depth}`}>
        {String(props.item.label)}:{props.depth}:{String(props.hasChildren)}:
        {String(props.isCheckbox)}
      </span>
    ))

    const screen = render(() => (
      <ContextMenu
        itemRender={itemRender}
        items={[
          {
            label: 'Parent',
            defaultOpen: true,
            children: [{ label: 'Child' }],
          },
          {
            type: 'checkbox',
            label: 'Checkbox',
          },
        ]}
      >
        {(props) => <div {...props}>Row Item</div>}
      </ContextMenu>
    ))

    fireEvent.contextMenu(screen.getByText('Row Item'), { clientX: 12, clientY: 18 })

    await waitFor(() => {
      expect(document.body.querySelector('[data-testid="custom-Child-1"]')).not.toBeNull()
    })

    expect(document.body.querySelector('[data-testid="custom-Parent-0"]')?.textContent).toContain(
      'Parent:0:true:false',
    )
    expect(document.body.querySelector('[data-testid="custom-Child-1"]')?.textContent).toContain(
      'Child:1:false:false',
    )
    expect(document.body.querySelector('[data-testid="custom-Checkbox-0"]')?.textContent).toContain(
      'Checkbox:0:false:true',
    )

    expect(itemRender).toHaveBeenCalled()
  })

  test('renders into portal by default', async () => {
    const screen = render(() => (
      <ContextMenu items={[{ label: 'Default portal' }]}>
        {(props) => <div {...props}>Row Item</div>}
      </ContextMenu>
    ))

    fireEvent.contextMenu(screen.getByText('Row Item'), { clientX: 10, clientY: 10 })

    await waitFor(() => {
      expect(screen.container.querySelector('[data-slot="content"]')).toBeNull()
      expect(document.body.querySelector('[data-slot="content"]')).not.toBeNull()
    })
  })

  test('renders controlled overlay without a trigger', async () => {
    render(() => <ContextMenu open items={[{ label: 'Open item' }]} />)

    await waitFor(() => {
      expect(document.body.querySelector('[data-slot="content"]')?.textContent).toContain(
        'Open item',
      )
    })
  })

  test('does not open when context menu trigger is disabled', async () => {
    vi.useFakeTimers()

    try {
      const screen = render(() => (
        <ContextMenu disabled items={[{ label: 'Disabled entry' }]}>
          {(props) => <div {...props}>Row Item</div>}
        </ContextMenu>
      ))

      const row = screen.getByText('Row Item')
      fireEvent.contextMenu(row, { clientX: 24, clientY: 32 })

      await waitFor(() => {
        expect(document.body.querySelector('[data-slot="content"]')).toBeNull()
      })

      fireEvent.pointerDown(row, {
        pointerType: 'touch',
        clientX: 30,
        clientY: 42,
      })
      await vi.advanceTimersByTimeAsync(700)

      expect(document.body.querySelector('[data-slot="content"]')).toBeNull()
    } finally {
      vi.useRealTimers()
    }
  })

  test('supports checkbox toggle and keeps disabled item from selecting', async () => {
    const onCheckedChange = vi.fn()
    const onDisabledSelect = vi.fn()

    const screen = render(() => (
      <ContextMenu
        items={[
          {
            type: 'checkbox',
            label: 'Pin',
            onCheckedChange,
          },
          {
            label: 'Disabled action',
            disabled: true,
            onSelect: onDisabledSelect,
          },
        ]}
      >
        {(props) => <div {...props}>Row Item</div>}
      </ContextMenu>
    ))

    fireEvent.contextMenu(screen.getByText('Row Item'), { clientX: 24, clientY: 32 })

    const checkboxItem = document.body.querySelector('[data-slot="item"]') as HTMLElement
    checkboxItem.focus()
    fireEvent.keyDown(checkboxItem, { key: 'Enter' })

    const disabledItem = Array.from(document.body.querySelectorAll('[data-slot="item"]')).find(
      (el) => el.textContent?.includes('Disabled action'),
    ) as HTMLElement

    fireEvent.click(disabledItem)

    expect(onCheckedChange).toHaveBeenCalledWith(true)
    expect(onDisabledSelect).not.toHaveBeenCalled()
  })

  test('supports radio items with grouped keyboard selection and disabled prevention', async () => {
    const onValueChange = vi.fn()
    const onDisabledSelect = vi.fn()

    const screen = render(() => (
      <ContextMenu
        items={[
          {
            type: 'radio',
            group: 'sort',
            value: 'name',
            label: 'Name',
            defaultChecked: true,
          },
          {
            type: 'radio',
            group: 'sort',
            value: 'date',
            label: 'Date',
            onValueChange,
          },
          {
            type: 'radio',
            group: 'sort',
            value: 'size',
            label: 'Size',
            disabled: true,
            onSelect: onDisabledSelect,
          },
        ]}
      >
        {(props) => <div {...props}>Row Item</div>}
      </ContextMenu>
    ))

    fireEvent.contextMenu(screen.getByText('Row Item'), { clientX: 24, clientY: 32 })

    const radioItems = Array.from(document.body.querySelectorAll('[role="menuitemradio"]'))
    const [nameItem, dateItem, disabledItem] = radioItems as [HTMLElement, HTMLElement, HTMLElement]

    expect(nameItem.getAttribute('aria-checked')).toBe('true')
    expect(dateItem.getAttribute('aria-checked')).toBe('false')

    dateItem.focus()
    fireEvent.keyDown(dateItem, { key: 'Enter' })

    expect(nameItem.getAttribute('aria-checked')).toBe('false')
    expect(dateItem.getAttribute('aria-checked')).toBe('true')
    expect(onValueChange).toHaveBeenCalledWith('date')

    disabledItem.focus()
    fireEvent.keyDown(disabledItem, { key: 'Enter' })

    expect(disabledItem.getAttribute('aria-checked')).toBe('false')
    expect(dateItem.getAttribute('aria-checked')).toBe('true')
    expect(onDisabledSelect).not.toHaveBeenCalled()
  })

  test('destructive item icon does not force muted color class', async () => {
    const screen = render(() => (
      <ContextMenu items={[{ label: 'Delete', color: 'destructive', icon: 'icon-trash-2' }]}>
        {(props) => <div {...props}>Row Item</div>}
      </ContextMenu>
    ))

    fireEvent.contextMenu(screen.getByText('Row Item'), { clientX: 16, clientY: 16 })

    await waitFor(() => {
      expect(document.body.querySelector('[data-slot="itemLeading"]')).not.toBeNull()
    })

    const leading = document.body.querySelector('[data-slot="itemLeading"]') as HTMLElement
    expect(leading.className).not.toContain('text-muted-foreground')
  })

  test('keeps submenu open while pointer moves through the submenu grace area', async () => {
    const screen = render(() => (
      <ContextMenu
        items={[
          {
            label: 'More',
            defaultOpen: true,
            children: [{ label: 'Nested action' }],
          },
          { label: 'Sibling action' },
        ]}
      >
        {(props) => <div {...props}>Row Item</div>}
      </ContextMenu>
    ))

    fireEvent.contextMenu(screen.getByText('Row Item'), { clientX: 16, clientY: 16 })

    await waitFor(() => {
      expect(document.body.querySelectorAll('[data-slot="content"]').length).toBeGreaterThanOrEqual(
        2,
      )
    })

    const items = Array.from(document.body.querySelectorAll('[data-slot="item"]'))
    const subTrigger = items.find((item) => item.textContent?.includes('More')) as HTMLElement
    const sibling = items.find((item) =>
      item.textContent?.includes('Sibling action'),
    ) as HTMLElement
    const subContent = Array.from(document.body.querySelectorAll('[data-slot="content"]')).find(
      (content) => content.textContent?.includes('Nested action'),
    ) as HTMLElement

    subContent.getBoundingClientRect = () => ({
      bottom: 120,
      height: 80,
      left: 60,
      right: 140,
      top: 40,
      width: 80,
      x: 60,
      y: 40,
      toJSON: () => ({}),
    })

    fireEvent.pointerLeave(subTrigger, { clientX: 50, clientY: 80, pointerType: 'mouse' })
    fireEvent.pointerEnter(sibling, { clientX: 80, clientY: 80, pointerType: 'mouse' })

    expect(sibling.hasAttribute('data-highlighted')).toBe(false)
    expect(subTrigger.getAttribute('data-expanded')).toBe('')
    expect(document.body.textContent).toContain('Nested action')
  })

  test('restores submenu selection after pointer grace when moving toward another submenu', async () => {
    vi.useFakeTimers()

    try {
      const screen = render(() => (
        <ContextMenu
          items={[
            {
              label: 'More',
              defaultOpen: true,
              children: [{ label: 'Nested action' }],
            },
            {
              label: 'More tools',
              children: [{ label: 'Second nested action' }],
            },
          ]}
        >
          {(props) => <div {...props}>Row Item</div>}
        </ContextMenu>
      ))

      fireEvent.contextMenu(screen.getByText('Row Item'), { clientX: 16, clientY: 16 })

      await waitFor(() => {
        expect(document.body.textContent).toContain('Nested action')
      })

      const items = Array.from(document.body.querySelectorAll('[data-slot="item"]'))
      const firstTrigger = items.find((item) => item.textContent?.includes('More')) as HTMLElement
      const secondTrigger = items.find((item) =>
        item.textContent?.includes('More tools'),
      ) as HTMLElement
      const firstContent = Array.from(document.body.querySelectorAll('[data-slot="content"]')).find(
        (content) => content.textContent?.includes('Nested action'),
      ) as HTMLElement

      firstContent.getBoundingClientRect = () => ({
        bottom: 120,
        height: 80,
        left: 60,
        right: 140,
        top: 40,
        width: 80,
        x: 60,
        y: 40,
        toJSON: () => ({}),
      })

      fireEvent.pointerLeave(firstTrigger, { clientX: 50, clientY: 80, pointerType: 'mouse' })
      fireEvent.pointerEnter(secondTrigger, {
        clientX: 80,
        clientY: 80,
        pointerType: 'mouse',
      })

      expect(secondTrigger.hasAttribute('data-highlighted')).toBe(false)

      await vi.advanceTimersByTimeAsync(301)

      expect(secondTrigger.getAttribute('data-highlighted')).toBe('')

      await vi.advanceTimersByTimeAsync(100)

      await waitFor(() => {
        expect(document.body.textContent).toContain('Second nested action')
      })
    } finally {
      vi.useRealTimers()
    }
  })

  test('applies styles override to content', async () => {
    const screen = render(() => (
      <ContextMenu
        styles={{
          content: {
            '--mo-enter-translate-x': '1rem',
            '--mo-enter-translate-y': '2rem',
            '--mo-exit-translate-x': '3rem',
            '--mo-exit-translate-y': '4rem',
            width: '200px',
          },
        }}
        items={[{ label: 'Open item' }]}
      >
        {(props) => <div {...props}>Row Item</div>}
      </ContextMenu>
    ))

    fireEvent.contextMenu(screen.getByText('Row Item'), { clientX: 12, clientY: 18 })

    await waitFor(() => {
      expect(document.body.querySelector('[data-slot="content"]')).not.toBeNull()
    })

    const content = document.body.querySelector<HTMLElement>('[data-slot="content"]')
    expect(content?.style.width).toBe('200px')
    expect(content?.style.getPropertyValue('--mo-enter-translate-x')).toBe('1rem')
    expect(content?.style.getPropertyValue('--mo-enter-translate-y')).toBe('2rem')
    expect(content?.style.getPropertyValue('--mo-exit-translate-x')).toBe('3rem')
    expect(content?.style.getPropertyValue('--mo-exit-translate-y')).toBe('4rem')
  })
})
