import { fireEvent, render, waitFor } from '@solidjs/testing-library'
import { Show, createComponent, createSignal } from 'solid-js'
import { describe, expect, test, vi } from 'vitest'

import { MoraineProvider } from '../../provider'
import { defineTheme } from '../../theme'
import { ButtonGroup } from '../button-group'

import { ToggleButton } from './toggle-button'
import type { ToggleButtonT } from './toggle-button.types'

describe('ToggleButton', () => {
  test('keeps conditional JSX children reactive and omits empty labels', () => {
    const [visible, setVisible] = createSignal(false)
    const screen = render(() => (
      <ToggleButton aria-label="Conditional">
        <Show when={visible()}>
          <span>Visible content</span>
        </Show>
      </ToggleButton>
    ))
    const button = screen.getByRole('button', { name: 'Conditional' })
    expect(button.querySelector('[data-slot="button-label"]')).toBeNull()
    setVisible(true)
    expect(screen.getByText('Visible content')).toBeDefined()
    fireEvent.click(button)
    setVisible(false)
    expect(button.querySelector('[data-slot="button-label"]')).toBeNull()
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
    expect(button.hasAttribute('data-selected')).toBe(false)
    expect(button.className).not.toContain('bg-secondary')
    fireEvent.click(button)
    expect(events).toEqual(['click', 'true'])
    expect(button.getAttribute('aria-pressed')).toBe('true')
    expect(button.hasAttribute('data-selected')).toBe(true)
    expect(button.className).toContain('bg-secondary')
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

  test('reactively resolves theme and instance variants, group defaults, and every slot override', () => {
    const theme = defineTheme({
      button: { base: { root: 'button-theme', label: 'button-label-theme' } },
      toggleButton: {
        defaultVariants: { variant: 'outline', activeVariant: 'default', size: 'lg' },
        base: { root: 'toggle-theme', label: 'toggle-label-theme' },
      },
    })
    const [variant, setVariant] = createSignal<ToggleButtonT.Variant['variant']>()
    const [activeVariant, setActiveVariant] = createSignal<ToggleButtonT.Variant['activeVariant']>()
    const [size, setSize] = createSignal<ToggleButtonT.Variant['size']>()
    const [customClass, setCustomClass] = createSignal('instance-class')
    const screen = render(() => (
      <MoraineProvider theme={theme}>
        <ToggleButton
          variant={variant()}
          activeVariant={activeVariant()}
          size={size()}
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
        <ButtonGroup size="sm" variant="destructive">
          <ToggleButton>Grouped</ToggleButton>
        </ButtonGroup>
      </MoraineProvider>
    ))
    const button = screen.getByRole('button', { name: 'Theme' })
    expect(button.className).toContain('border-border')
    expect(button.className).toContain('h-9')
    for (const cls of ['button-theme', 'toggle-theme', 'instance-class', 'root-override']) {
      expect(button.className).toContain(cls)
    }
    expect(button.style.color).toBe('blue')
    for (const [slot, opacity] of [
      ['leading', '0.5'],
      ['trailing', '0.75'],
    ] as const) {
      const icon = button.querySelector<HTMLElement>(`[data-slot="button-${slot}"]`)!
      expect(icon.className).toContain(`${slot}-override`)
      expect(icon.style.opacity).toBe(opacity)
    }
    const label = button.querySelector<HTMLElement>('[data-slot="button-label"]')!
    expect(label.className).toContain('button-label-theme')
    expect(label.className).toContain('toggle-label-theme')
    expect(label.className).toContain('label-override')
    expect(label.style.fontWeight).toBe('600')
    fireEvent.click(button)
    expect(button.className).toContain('bg-primary')
    setActiveVariant('secondary')
    expect(button.className).toContain('bg-secondary')
    fireEvent.click(button)
    setVariant('destructive')
    setSize('icon-sm')
    setCustomClass('updated-class')
    expect(button.className).toContain('bg-destructive')
    expect(button.className).toContain('size-6')
    expect(button.className).toContain('updated-class')
    const grouped = screen.getByRole('button', { name: 'Grouped' })
    expect(grouped.className).toContain('bg-destructive')
    expect(grouped.className).toContain('h-7')
    fireEvent.click(grouped)
    expect(grouped.className).toContain('bg-primary')
  })

  test('retains getter-backed JSX children across state and loading updates', () => {
    let reads = 0
    const [loading, setLoading] = createSignal(false)
    const [text, setText] = createSignal('Draft')
    const screen = render(() =>
      createComponent(ToggleButton, {
        get loading() {
          return loading()
        },
        get children() {
          reads += 1
          return <span>{text()}</span>
        },
      }),
    )
    const button = screen.getByRole('button')
    const content = screen.getByText('Draft')
    expect(reads).toBe(1)
    fireEvent.click(button)
    setLoading(true)
    setText('Updated')
    expect(screen.getByText('Updated')).toBe(content)
    expect(reads).toBe(1)
  })
})
