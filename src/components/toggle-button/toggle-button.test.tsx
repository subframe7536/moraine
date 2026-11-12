import { fireEvent, render, waitFor } from '@solidjs/testing-library'
import type { JSX } from 'solid-js'
import { Show, createSignal } from 'solid-js'
import { describe, expect, test, vi } from 'vitest'

import { MoraineProvider } from '../../provider'
import { defineTheme } from '../../theme'
import { ButtonGroup } from '../button-group'

import { ToggleButton } from './toggle-button'

describe('ToggleButton', () => {
  test('shows conditional JSX children when their condition changes', () => {
    const [visible, setVisible] = createSignal(false)
    const screen = render(() => (
      <ToggleButton aria-label="Conditional">
        <Show when={visible()}>
          <span>Visible content</span>
        </Show>
      </ToggleButton>
    ))
    const button = screen.getByRole('button', { name: 'Conditional' })

    expect(screen.queryByText('Visible content')).toBeNull()
    setVisible(true)
    expect(button.textContent).toContain('Visible content')
    setVisible(false)
    expect(screen.queryByText('Visible content')).toBeNull()
  })
  test('toggles native button state after the caller click without submitting its form', () => {
    const onSubmit = vi.fn()
    const events: string[] = []
    const ref = vi.fn()
    const screen = render(() => (
      <form onSubmit={onSubmit}>
        <ToggleButton
          ref={ref}
          onClick={() => events.push('click')}
          onPressedChange={(pressed) => events.push(String(pressed))}
        >
          Bold
        </ToggleButton>
      </form>
    ))
    const button = screen.getByRole('button', { name: 'Bold' }) as HTMLButtonElement
    expect(button.type).toBe('button')
    expect(ref).toHaveBeenCalledWith(button)
    expect(button.getAttribute('aria-pressed')).toBe('false')
    expect(button.hasAttribute('data-pressed')).toBe(false)
    fireEvent.click(button)
    expect(events).toEqual(['click', 'true'])
    expect(button.getAttribute('aria-pressed')).toBe('true')
    expect(button.hasAttribute('data-pressed')).toBe(true)
    fireEvent.click(button)
    expect(events).toEqual(['click', 'true', 'click', 'false'])
    expect(button.getAttribute('aria-pressed')).toBe('false')
    expect(onSubmit).not.toHaveBeenCalled()
  })

  test('uses initial uncontrolled state and waits for controlled updates', () => {
    const [pressed, setPressed] = createSignal(false)
    const onPressedChange = vi.fn()
    const screen = render(() => (
      <>
        <ToggleButton defaultPressed>Initial</ToggleButton>
        <ToggleButton pressed={pressed()} onPressedChange={onPressedChange}>
          Controlled
        </ToggleButton>
      </>
    ))
    expect(screen.getByRole('button', { name: 'Initial' }).getAttribute('aria-pressed')).toBe(
      'true',
    )
    const controlled = screen.getByRole('button', { name: 'Controlled' })
    fireEvent.click(controlled)
    expect(onPressedChange).toHaveBeenCalledExactlyOnceWith(true)
    expect(controlled.getAttribute('aria-pressed')).toBe('false')
    setPressed(true)
    expect(controlled.getAttribute('aria-pressed')).toBe('true')
    fireEvent.click(controlled)
    expect(onPressedChange).toHaveBeenLastCalledWith(false)
    expect(onPressedChange).toHaveBeenCalledTimes(2)
  })

  test('honors cancelled clicks and inherited disabled/loading activation guards', () => {
    const onPressedChange = vi.fn()
    const onClick = vi.fn()
    const screen = render(() => (
      <>
        <ToggleButton
          onClick={[
            (cancel: boolean, event) => {
              if (cancel) {
                event.preventDefault()
              }
            },
            true,
          ]}
          onPressedChange={onPressedChange}
        >
          Cancelled
        </ToggleButton>
        <ToggleButton disabled onClick={onClick} onPressedChange={onPressedChange}>
          Disabled
        </ToggleButton>
        <ToggleButton loading onClick={onClick} onPressedChange={onPressedChange}>
          Loading
        </ToggleButton>
      </>
    ))
    for (const name of ['Cancelled', 'Disabled', 'Loading']) {
      const button = screen.getByRole('button', { name })
      fireEvent.click(button)
      expect(button.getAttribute('aria-pressed')).toBe('false')
    }
    expect(onClick).not.toHaveBeenCalled()
    expect(onPressedChange).not.toHaveBeenCalled()
  })

  test.each(['resolve', 'reject'] as const)(
    'preserves async clicks through loadingAuto on %s',
    async (outcome) => {
      let resolve!: () => void
      let reject!: (error: Error) => void
      const promise = new Promise<void>((res, rej) => {
        resolve = res
        reject = rej
      })
      const onClick = vi.fn(() => promise)
      const onPressedChange = vi.fn()
      const screen = render(() => (
        <ToggleButton
          loadingAuto
          onClick={onClick}
          onPressedChange={onPressedChange}
          aria-label="Bookmark"
        >
          {(state) => (
            <span>
              {state.pressed ? 'Saved' : 'Unsaved'} / {state.loading ? 'Pending' : 'Ready'}
            </span>
          )}
        </ToggleButton>
      ))
      const button = screen.getByRole('button', { name: 'Bookmark' })
      button.focus()
      fireEvent.click(button)
      expect(button.getAttribute('aria-pressed')).toBe('true')
      expect(button.textContent).toBe('Saved / Pending')
      expect(button.getAttribute('aria-busy')).toBe('true')
      fireEvent.click(button)
      expect(onClick).toHaveBeenCalledTimes(1)
      expect(onPressedChange).toHaveBeenCalledExactlyOnceWith(true)
      expect(document.activeElement).toBe(button)
      if (outcome === 'resolve') {
        resolve()
      } else {
        reject(new Error('Request failed'))
      }
      await waitFor(() => expect(button.hasAttribute('aria-busy')).toBe(false))
      expect(button.textContent).toBe('Saved / Ready')
      fireEvent.click(button)
      expect(onPressedChange).toHaveBeenLastCalledWith(false)
    },
  )

  test('applies theme, instance, and slot overrides to their slots', () => {
    const theme = defineTheme({
      button: { base: { root: 'button-theme', label: 'button-label-theme' } },
      toggleButton: {
        base: { root: 'toggle-theme', label: 'toggle-label-theme' },
      },
    })
    const [customClass, setCustomClass] = createSignal('instance-class')
    const screen = render(() => (
      <MoraineProvider theme={theme}>
        <ToggleButton
          leading="icon-check"
          trailing="icon-arrow-right"
          class={customClass()}
          classes={{
            root: 'root-override',
            leading: 'leading-override',
            label: 'label-override',
            trailing: 'trailing-override',
          }}
          styles={{
            root: { color: 'red' },
            leading: { opacity: 0.5 },
            label: { 'font-weight': 600 },
            trailing: { opacity: 0.75 },
          }}
          style={{ color: 'blue' }}
        >
          Theme
        </ToggleButton>
      </MoraineProvider>
    ))
    const button = screen.getByRole('button', { name: 'Theme' })
    for (const cls of ['button-theme', 'toggle-theme', 'instance-class', 'root-override']) {
      expect(button.classList.contains(cls)).toBe(true)
    }
    expect(button.style.color).toBe('blue')
    for (const [slot, opacity] of [
      ['leading', '0.5'],
      ['trailing', '0.75'],
    ] as const) {
      const icon = button.querySelector<HTMLElement>(`[data-slot="button-${slot}"]`)!
      expect(icon.classList.contains(`${slot}-override`)).toBe(true)
      expect(icon.style.opacity).toBe(opacity)
    }
    const label = button.querySelector<HTMLElement>('[data-slot="button-label"]')!
    expect(label.classList.contains('button-label-theme')).toBe(true)
    expect(label.classList.contains('toggle-label-theme')).toBe(true)
    expect(label.classList.contains('label-override')).toBe(true)
    expect(label.style.fontWeight).toBe('600')
    setCustomClass('updated-class')
    expect(button.classList.contains('updated-class')).toBe(true)
    expect(button.classList.contains('instance-class')).toBe(false)
  })

  test('toggles pressed state of a button inside a ButtonGroup', () => {
    const screen = render(() => (
      <ButtonGroup size="sm" variant="solid" tone="danger">
        <ToggleButton>Grouped</ToggleButton>
      </ButtonGroup>
    ))
    const grouped = screen.getByRole('button', { name: 'Grouped' })

    expect(grouped.getAttribute('aria-pressed')).toBe('false')
    fireEvent.click(grouped)
    expect(grouped.getAttribute('aria-pressed')).toBe('true')
  })

  test('keeps reactive children current across pressed and loading updates', () => {
    const [loading, setLoading] = createSignal(false)
    const [text, setText] = createSignal('Draft')
    const screen = render(() => (
      <ToggleButton loading={loading()}>
        <span>{text()}</span>
      </ToggleButton>
    ))
    const button = screen.getByRole('button')

    expect(screen.getByText('Draft')).not.toBeNull()
    fireEvent.click(button)
    setLoading(true)
    setText('Updated')
    expect(screen.getByText('Updated')).not.toBeNull()
    expect(button.getAttribute('aria-pressed')).toBe('true')
  })

  test('supports non-native element roots with role=button and keyboard activation', async () => {
    let divRef: HTMLDivElement | undefined
    const onDivToggle = vi.fn()

    const screen = render(() => (
      <ToggleButton
        as="div"
        ref={(el: HTMLDivElement) => (divRef = el)}
        onPressedChange={onDivToggle}
      >
        Div toggle
      </ToggleButton>
    ))

    const divBtn = screen.getByRole('button', { name: 'Div toggle' })
    expect(divBtn.tagName).toBe('DIV')
    expect(divRef).toBe(divBtn)
    expect(divBtn.getAttribute('role')).toBe('button')
    expect(divBtn.getAttribute('tabindex')).toBe('0')
    expect(divBtn.getAttribute('aria-pressed')).toBe('false')
    expect(divBtn.hasAttribute('type')).toBe(false)

    fireEvent.click(divBtn)
    expect(onDivToggle).toHaveBeenCalledWith(true)
    expect(divBtn.getAttribute('aria-pressed')).toBe('true')

    // Keyboard activation (Enter) reuses Button's useButtonInteraction
    fireEvent.keyDown(divBtn, { key: 'Enter' })
    expect(onDivToggle).toHaveBeenCalledWith(false)
    expect(divBtn.getAttribute('aria-pressed')).toBe('false')
  })

  test('supports anchor roots and forwards href without type attribute', () => {
    let anchorRef: HTMLAnchorElement | undefined
    const onAnchorToggle = vi.fn()

    render(() => (
      <ToggleButton
        as="a"
        href="#test"
        ref={(el: HTMLAnchorElement) => (anchorRef = el)}
        onPressedChange={onAnchorToggle}
      >
        Anchor toggle
      </ToggleButton>
    ))

    const anchorBtn = anchorRef!
    expect(anchorBtn.tagName).toBe('A')
    expect(anchorBtn.getAttribute('href')).toBe('#test')
    expect(anchorBtn.hasAttribute('type')).toBe(false)
    expect(anchorBtn.getAttribute('aria-pressed')).toBe('false')

    fireEvent.click(anchorBtn)
    expect(onAnchorToggle).toHaveBeenCalledWith(true)
    expect(anchorBtn.getAttribute('aria-pressed')).toBe('true')
  })

  test('supports custom component roots and forwards attributes', () => {
    const CustomRoot = (props: JSX.HTMLAttributes<HTMLSpanElement>) => <span {...props} />

    const screen = render(() => (
      <ToggleButton as={CustomRoot} data-custom="yes">
        Custom root
      </ToggleButton>
    ))

    const customRoot = screen.getByRole('button', { name: 'Custom root' })
    expect(customRoot.tagName).toBe('SPAN')
    expect(customRoot.getAttribute('data-custom')).toBe('yes')
    expect(customRoot.getAttribute('aria-pressed')).toBe('false')
    fireEvent.click(customRoot)
    expect(customRoot.getAttribute('aria-pressed')).toBe('true')
  })
})
