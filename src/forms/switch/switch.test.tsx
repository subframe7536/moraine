import { fireEvent, render, waitFor } from '@solidjs/testing-library'
import { createComponent, createSignal } from 'solid-js'
import { hydrate } from 'solid-js/web'
import { describe, expect, test, vi } from 'vitest'

import { installHydrationState, renderSsrFixture } from '../../test-utils/ssr-test.ts'

import { Switch } from './switch.tsx'

function expectSwitchChecked(element: Element, checked: boolean): void {
  expect(element.getAttribute('aria-checked')).toBe(String(checked))
}

describe('Switch', () => {
  test('renders label and description with accessible switch input', () => {
    const screen = render(() => <Switch label="Email alerts" description="Receive updates" />)

    const switchInput = screen.getByRole('switch', { name: 'Email alerts' })
    const root = screen.container.querySelector('[data-slot="root"]')
    const track = screen.container.querySelector('[data-slot="track"]')

    expect(switchInput).not.toBeNull()
    const input = screen.container.querySelector('[data-slot="input"]')

    expect(root?.tagName).toBe('DIV')
    expect(track?.tagName).toBe('BUTTON')
    expect(input?.getAttribute('aria-hidden')).toBe('true')
    expect(screen.getByText('Receive updates')).not.toBeNull()
  })

  test('supports uncontrolled toggle', async () => {
    const screen = render(() => <Switch label="Marketing" />)
    const switchInput = screen.getByRole('switch', { name: 'Marketing' })

    expectSwitchChecked(switchInput, false)
    await fireEvent.click(switchInput)
    expectSwitchChecked(switchInput, true)
  })

  test.each([' ', 'Enter'])(
    'toggles once from an explicit synthetic %s compatibility click',
    async (key) => {
      const onChange = vi.fn()
      const screen = render(() => <Switch label="Keyboard" onChange={onChange} />)
      const switchInput = screen.getByRole('switch', { name: 'Keyboard' })

      await fireEvent.keyDown(switchInput, { key })
      await fireEvent.keyUp(switchInput, { key })

      expect(onChange).not.toHaveBeenCalled()

      await fireEvent.click(switchInput, { detail: 0 })

      expect(onChange).toHaveBeenCalledTimes(1)
      expect(onChange).toHaveBeenLastCalledWith(true)
      expectSwitchChecked(switchInput, true)
    },
  )

  test('does not toggle when disabled', async () => {
    const onChange = vi.fn()
    const screen = render(() => <Switch disabled label="Disabled" onChange={onChange} />)
    const switchInput = screen.getByRole('switch', { name: 'Disabled' })
    expect(switchInput.getAttribute('aria-disabled')).toBe('true')

    await fireEvent.click(switchInput)

    expectSwitchChecked(switchInput, false)
    expect(onChange).not.toHaveBeenCalled()
  })

  test('passes id, name, value and required attributes to input', () => {
    const screen = render(() => (
      <Switch id="newsletter-switch" name="newsletter" value="yes" required label="Newsletter" />
    ))

    const switchInput = screen.getByRole('switch', { name: 'Newsletter' })
    const input = screen.container.querySelector('[data-slot="input"]')

    expect(switchInput.getAttribute('id')).toBe('newsletter-switch')
    expect(input?.getAttribute('id')).toBe('newsletter-switch-input')
    expect(input?.getAttribute('name')).toBe('newsletter')
    expect(input?.getAttribute('value')).toBe('yes')
    expect(input?.getAttribute('required')).not.toBeNull()
  })

  test('keeps controlled state while emitting onChange', async () => {
    const onChange = vi.fn()
    const screen = render(() => <Switch checked label="Controlled" onChange={onChange} />)
    const switchInput = screen.getByRole('switch', { name: 'Controlled' })

    await fireEvent.click(switchInput)

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith(false)

    await waitFor(() => {
      expectSwitchChecked(switchInput, true)
    })
  })

  test('does not toggle a controlled readOnly switch', async () => {
    const onChange = vi.fn()
    const screen = render(() => <Switch checked readOnly label="Readonly" onChange={onChange} />)
    const switchInput = screen.getByRole('switch', { name: 'Readonly' })

    expect(switchInput.getAttribute('aria-readonly')).toBe('true')

    await fireEvent.click(switchInput)

    expectSwitchChecked(switchInput, true)
    expect(onChange).not.toHaveBeenCalled()

    expectSwitchChecked(switchInput, true)
    expect(onChange).not.toHaveBeenCalled()
  })

  test('does not toggle an uncontrolled readOnly switch', async () => {
    const onChange = vi.fn()
    const screen = render(() => (
      <Switch readOnly label="Readonly uncontrolled" onChange={onChange} />
    ))
    const switchInput = screen.getByRole('switch', {
      name: 'Readonly uncontrolled',
    })

    await fireEvent.click(switchInput)

    expectSwitchChecked(switchInput, false)
    expect(onChange).not.toHaveBeenCalled()

    expectSwitchChecked(switchInput, false)
    expect(onChange).not.toHaveBeenCalled()
  })

  test('maps custom numeric values for controlled switch', async () => {
    const onChange = vi.fn()
    const screen = render(() => (
      <Switch checked={1} trueValue={1} falseValue={0} label="Visibility" onChange={onChange} />
    ))
    const switchInput = screen.getByRole('switch', { name: 'Visibility' })

    expectSwitchChecked(switchInput, true)

    await fireEvent.click(switchInput)

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith(0)

    await waitFor(() => {
      expectSwitchChecked(switchInput, true)
    })
  })

  test('shows loading icon and disables interaction when loading', () => {
    const screen = render(() => (
      <Switch loading label="Loading" loadingIcon={<span data-testid="loading-icon">L</span>} />
    ))

    const switchInput = screen.getByRole('switch', { name: 'Loading' })
    expect(switchInput.getAttribute('aria-disabled')).toBe('true')
    expect(screen.getByTestId('loading-icon').textContent).toBe('L')
  })

  test('switches between unchecked and checked icons', async () => {
    const screen = render(() => (
      <Switch
        label="Icon state"
        checkedIcon={<span data-testid="checked-icon">C</span>}
        uncheckedIcon={<span data-testid="unchecked-icon">U</span>}
      />
    ))
    const switchInput = screen.getByRole('switch', { name: 'Icon state' })

    expect(screen.getByTestId('unchecked-icon').textContent).toBe('U')
    await fireEvent.click(switchInput)
    expect(screen.getByTestId('checked-icon').textContent).toBe('C')
  })

  test('submits hidden switch value only when checked and resets to default state', async () => {
    const screen = render(() => (
      <form>
        <Switch name="enabled" value="yes" defaultChecked label="Enabled" />
        <button type="reset">Reset</button>
      </form>
    ))

    const form = screen.container.querySelector('form') as HTMLFormElement
    const switchInput = screen.getByRole('switch', { name: 'Enabled' })

    expectSwitchChecked(switchInput, true)
    expect(new FormData(form).get('enabled')).toBe('yes')

    await fireEvent.click(switchInput)

    expectSwitchChecked(switchInput, false)
    expect(new FormData(form).has('enabled')).toBe(false)

    form.reset()

    await waitFor(() => {
      expectSwitchChecked(switchInput, true)
      expect(new FormData(form).get('enabled')).toBe('yes')
    })
  })

  test('resets uncontrolled state to the initial default without emitting changes', async () => {
    const onChange = vi.fn()
    const screen = render(() => (
      <form>
        <Switch name="enabled" defaultChecked={false} label="Enabled" onChange={onChange} />
      </form>
    ))
    const form = screen.container.querySelector('form') as HTMLFormElement
    const switchInput = screen.getByRole('switch', { name: 'Enabled' })

    await fireEvent.click(switchInput)
    expectSwitchChecked(switchInput, true)
    expect(onChange).toHaveBeenCalledTimes(1)

    form.reset()

    await waitFor(() => expectSwitchChecked(switchInput, false))
    expect(onChange).toHaveBeenCalledTimes(1)
  })

  test('resets controlled switches to their latest value without callbacks or form value drift', async () => {
    const onChange = vi.fn()
    const screen = render(() => (
      <form>
        <Switch
          checked={0}
          falseValue={0}
          label="Visibility"
          name="visibility"
          trueValue={1}
          onChange={onChange}
        />
      </form>
    ))
    const form = screen.container.querySelector('form') as HTMLFormElement
    const switchInput = screen.getByRole('switch', { name: 'Visibility' })

    await fireEvent.click(switchInput)
    expect(onChange).toHaveBeenCalledWith(1)

    form.reset()

    await waitFor(() => {
      expectSwitchChecked(switchInput, false)
      expect(new FormData(form).has('visibility')).toBe(false)
    })
    expect(onChange).toHaveBeenCalledTimes(1)
  })

  test('applies xl size classes on base and wrapper', () => {
    const screen = render(() => <Switch label="Classes" size="xl" />)

    const root = screen.container.querySelector('[data-slot="root"]')
    const input = screen.container.querySelector('[data-slot="input"]')
    const track = screen.container.querySelector('[data-slot="track"]')
    const wrapper = screen.container.querySelector('[data-slot="wrapper"]')

    expect(root?.className).toContain('flex flex-row')
    expect(track?.className).toContain('cursor-pointer')
    expect(input?.className).toContain('peer')
    expect(track?.className).toContain('focus-visible:effect-fv-border')
    expect(track?.className).toContain('transition-[color,background-color,box-shadow]')
    expect(track?.className).toContain('w-10')
    expect(wrapper?.className).toContain('ms-3')
    expect(wrapper?.className).toContain('text-base')
    expect(screen.getByText('Classes').className).toContain('select-none')
  })

  test('applies compact wrapper spacing on xs size', () => {
    const screen = render(() => <Switch label="Compact" size="xs" />)
    const wrapper = screen.container.querySelector('[data-slot="wrapper"]')

    expect(wrapper?.className).toContain('ms-1.5')
    expect(wrapper?.className).toContain('text-xs')
  })

  test('applies styles.root override', () => {
    const screen = render(() => <Switch label="Classes" styles={{ root: { width: '200px' } }} />)
    const root = screen.container.querySelector('[data-slot="root"]') as HTMLElement | null

    expect(root?.style.width).toBe('200px')
  })

  test('runs the caller click handler before toggling and respects cancellation', async () => {
    const onChange = vi.fn()
    const onClick = vi.fn((event: MouseEvent) => event.preventDefault())
    const screen = render(() => <Switch label="Canceled" onChange={onChange} onClick={onClick} />)
    const switchInput = screen.getByRole('switch', { name: 'Canceled' })

    await fireEvent.click(switchInput, { shiftKey: true })

    expect(onClick).toHaveBeenCalledTimes(1)
    expect(onClick.mock.calls[0]?.[0].shiftKey).toBe(true)
    expect(onChange).not.toHaveBeenCalled()
    expectSwitchChecked(switchInput, false)
  })

  test('evaluates conditional JSX props once and preserves numeric content', () => {
    const reads = {
      checkedIcon: 0,
      description: 0,
      label: 0,
      loadingIcon: 0,
      uncheckedIcon: 0,
    }
    const screen = render(() =>
      createComponent(Switch, {
        loading: true,
        get checkedIcon() {
          reads.checkedIcon += 1
          return <span>Checked</span>
        },
        get description() {
          reads.description += 1
          return 0
        },
        get label() {
          reads.label += 1
          return 0
        },
        get loadingIcon() {
          reads.loadingIcon += 1
          return <span>Loading</span>
        },
        get uncheckedIcon() {
          reads.uncheckedIcon += 1
          return <span>Unchecked</span>
        },
      }),
    )

    expect(screen.getByRole('switch', { name: '0' })).not.toBeNull()
    expect(screen.getAllByText('0')).toHaveLength(2)
    expect(screen.getByText('Loading')).not.toBeNull()
    expect(reads).toEqual({
      checkedIcon: 1,
      description: 1,
      label: 1,
      loadingIcon: 1,
      uncheckedIcon: 1,
    })
  })

  test('hydrates checked conditional content without replacing server nodes', () => {
    const markup = renderSsrFixture(
      '/src/forms/switch/switch.ssr.fixture.tsx',
      'renderSwitchFixture',
    )
    const container = document.createElement('div')
    container.innerHTML = markup
    document.body.append(container)
    const serverRoot = container.querySelector('[data-slot="root"]') as HTMLElement
    const serverTrack = container.querySelector('[data-slot="track"]') as HTMLElement
    const serverInput = container.querySelector('[data-slot="input"]') as HTMLInputElement
    const [checked, setChecked] = createSignal(true)
    const restoreHydrationState = installHydrationState()

    const dispose = hydrate(
      () => (
        <Switch
          id="ssr-switch"
          checked={checked()}
          label={0}
          description="Server description"
          checkedIcon={<span data-testid="checked-icon">Checked</span>}
        />
      ),
      container,
    )

    expect(container.querySelector('[data-slot="root"]')).toBe(serverRoot)
    expect(container.querySelector('[data-slot="track"]')).toBe(serverTrack)
    expect(container.querySelector('[data-slot="input"]')).toBe(serverInput)
    expectSwitchChecked(serverTrack, true)
    expect(container.querySelector('[data-testid="checked-icon"]')).not.toBeNull()

    setChecked(false)
    expectSwitchChecked(serverTrack, false)
    expect(container.querySelector('[data-testid="checked-icon"]')).toBeNull()

    dispose()
    container.remove()
    restoreHydrationState()
  }, 15_000)
})
