import { fireEvent, render } from '@solidjs/testing-library'
import type { JSX } from '@solidjs/web'
import { createSignal, flush } from 'solid-js'
import { describe, expect, vi, it } from 'vitest'

import { MoraineProvider } from '../../provider'

import { Stepper } from './stepper'
import type { StepperT } from './stepper.types'
if (!(globalThis as Record<string, unknown>).ResizeObserver) {
  ;(globalThis as Record<string, unknown>).ResizeObserver = class {
    // oxlint-disable-next-line class-methods-use-this
    observe() {}
    // oxlint-disable-next-line class-methods-use-this
    unobserve() {}
    // oxlint-disable-next-line class-methods-use-this
    disconnect() {}
  }
}

describe('stepper', () => {
  it('uses unique instance IDs and one selected tab for duplicate values', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const screen = render(() => (
      <Stepper
        aria-label="Checkout steps"
        aria-labelledby="checkout-heading"
        value="billing address"
        items={[
          { value: 'billing address', label: 'First', content: 'First panel' },
          { value: 'billing address', label: 'Second', content: 'Second panel' },
        ]}
      />
    ))
    const tabs = screen.getAllByRole('tab')
    const panel = screen.getByRole('tabpanel')
    const ids = Array.from(screen.container.querySelectorAll('[id]'), (element) => element.id)

    expect(new Set(ids).size).toBe(ids.length)
    expect(screen.getByRole('tablist').getAttribute('aria-label')).toBe('Checkout steps')
    expect(screen.getByRole('tablist').getAttribute('aria-labelledby')).toBe('checkout-heading')
    expect(screen.container.firstElementChild?.hasAttribute('aria-label')).toBe(false)
    expect(screen.container.firstElementChild?.hasAttribute('aria-labelledby')).toBe(false)
    expect(tabs.filter((tab) => tab.getAttribute('aria-selected') === 'true')).toHaveLength(1)
    expect(tabs[0]?.getAttribute('aria-controls')).toBe(panel.id)
    expect(panel.getAttribute('aria-labelledby')).toBe(tabs[0]?.id)
    expect(tabs[1]?.hasAttribute('aria-controls')).toBe(false)
    expect(warn).toHaveBeenCalledTimes(1)
    warn.mockRestore()
  })

  it('falls back when the requested or current item becomes disabled', () => {
    const [disabled, setDisabled] = createSignal(false)
    const screen = render(() => (
      <Stepper
        value="shipping"
        items={[
          { value: 'address', label: 'Address', content: 'Address panel' },
          { value: 'shipping', label: 'Shipping', disabled: disabled(), content: 'Shipping panel' },
        ]}
      />
    ))
    flush(() => setDisabled(true))
    const address = screen.getByRole('tab', { name: 'Address' })
    const shipping = screen.getByRole('tab', { name: 'Shipping' })
    expect(address.getAttribute('aria-selected')).toBe('true')
    expect(address.getAttribute('tabindex')).toBe('0')
    expect(shipping.getAttribute('aria-selected')).toBe('false')
    expect(shipping.getAttribute('tabindex')).toBe('-1')
    expect(screen.getByRole('tabpanel').textContent).toBe('Address panel')
  })

  it('updates effective selection when an uncontrolled step becomes disabled', () => {
    const [disabled, setDisabled] = createSignal(false)
    const screen = render(() => (
      <Stepper
        defaultValue="shipping"
        items={[
          { value: 'address', label: 'Address', content: 'Address panel' },
          { value: 'shipping', label: 'Shipping', disabled: disabled(), content: 'Shipping panel' },
        ]}
      />
    ))
    expect(screen.getByRole('tabpanel').textContent).toBe('Shipping panel')
    flush(() => setDisabled(true))
    expect(screen.getByRole('tabpanel').textContent).toBe('Address panel')
  })

  it.each([0, ''])('mounts a panel for falsy content %s', (content) => {
    const screen = render(() => (
      <Stepper items={[{ value: 'step', label: 'Step', content, class: 'item-only' }]} />
    ))
    expect(screen.getByRole('tabpanel').textContent).toBe(String(content))
    expect(screen.getByRole('tabpanel').className).not.toContain('item-only')
    expect(screen.container.querySelector('[data-slot="stepper-item"]')?.className).toContain(
      'item-only',
    )
  })

  it('renders JSX titles and delays an inactive panel until its step is selected', () => {
    const [value, setValue] = createSignal('first')
    const view = render(() => (
      <Stepper
        value={value()}
        items={[
          { value: 'first', label: 'First' },
          {
            value: 'second',
            label: <span>Second</span>,
            description: <span>Description</span>,
            content: <span>Panel</span>,
          },
        ]}
      />
    ))
    expect(view.getByText('Second')).not.toBeNull()
    expect(view.queryByRole('tabpanel')).toBeNull()
    flush(() => setValue('second'))
    expect(view.getByRole('tabpanel').textContent).toBe('Panel')
  })

  const ITEMS: [StepperT.Item, StepperT.Item, StepperT.Item] = [
    {
      label: 'Address',
      description: 'Add your address here',
      value: 'address',
      content: 'Address content',
    },
    {
      label: 'Shipping',
      description: 'Set your preferred shipping method',
      value: 'shipping',
      content: 'Shipping content',
    },
    {
      label: 'Checkout',
      description: 'Confirm your order',
      value: 'checkout',
      content: 'Checkout content',
    },
  ]

  it('renders step triggers and current content', () => {
    const screen = render(() => <Stepper items={ITEMS} defaultValue="address" />)

    expect(screen.getByRole('tab', { name: 'Address' })).not.toBeNull()
    expect(screen.getByRole('tab', { name: 'Shipping' })).not.toBeNull()
    expect(screen.getByText('Address content')).not.toBeNull()
    expect(screen.getByRole('tabpanel').textContent).toContain('Address content')
  })

  it('renders tabpanel content for the selected step', () => {
    const screen = render(() => <Stepper items={ITEMS} defaultValue="address" navigation="free" />)

    const getSelectedPanel = () =>
      screen.container.querySelector('[data-slot="stepper-content"][data-selected]')

    expect(getSelectedPanel()?.textContent).toContain('Address content')

    fireEvent.click(screen.getByRole('tab', { name: 'Shipping' }))

    expect(getSelectedPanel()?.textContent).toContain('Shipping content')
  })

  it('only links tabs to panels that are mounted', () => {
    const screen = render(() => (
      <Stepper
        items={[
          { value: 'first', label: 'First', content: 'First content' },
          { value: 'second', label: 'Second', content: 'Second content' },
          { value: 'empty', label: 'Empty' },
        ]}
        defaultValue="first"
        navigation="free"
      />
    ))
    const first = screen.getByRole('tab', { name: 'First' })
    const second = screen.getByRole('tab', { name: 'Second' })
    const empty = screen.getByRole('tab', { name: 'Empty' })

    expect(first.getAttribute('aria-controls')).toBe(screen.getByRole('tabpanel').id)
    expect(second.hasAttribute('aria-controls')).toBe(false)
    expect(empty.hasAttribute('aria-controls')).toBe(false)

    fireEvent.click(second)

    expect(first.hasAttribute('aria-controls')).toBe(false)
    expect(second.getAttribute('aria-controls')).toBe(screen.getByRole('tabpanel').id)
    expect(empty.hasAttribute('aria-controls')).toBe(false)

    fireEvent.click(empty)

    expect(screen.queryByRole('tabpanel')).toBeNull()
    const controlledIds = screen
      .getAllByRole('tab')
      .map((trigger) => trigger.getAttribute('aria-controls'))
      .filter((id): id is string => Boolean(id))
    expect(controlledIds.every((id) => screen.container.querySelector(`#${id}`) !== null)).toBe(
      true,
    )
  })

  it('updates aria-controls when panel content is added or removed', () => {
    const [content, setContent] = createSignal<JSX.Element>()
    const screen = render(() => (
      <Stepper
        items={[{ value: 'dynamic', label: 'Dynamic', content: content() }]}
        defaultValue="dynamic"
      />
    ))
    const trigger = screen.getByRole('tab', { name: 'Dynamic' })

    expect(trigger.hasAttribute('aria-controls')).toBe(false)

    flush(() => setContent('Dynamic content'))

    const panel = screen.getByRole('tabpanel')
    expect(screen.getByRole('tab', { name: 'Dynamic' }).getAttribute('aria-controls')).toBe(
      panel.id,
    )

    flush(() => setContent(undefined))

    expect(screen.queryByRole('tabpanel')).toBeNull()
    expect(screen.getByRole('tab', { name: 'Dynamic' }).hasAttribute('aria-controls')).toBe(false)
  })

  it('supports controlled value and emits onValueChange with item value', () => {
    const onValueChange = vi.fn<(...args: Array<any>) => void>()

    const screen = render(() => (
      <Stepper items={ITEMS} value="address" onValueChange={onValueChange} navigation="linear" />
    ))

    fireEvent.click(screen.getByRole('tab', { name: 'Shipping' }))

    expect(onValueChange).toHaveBeenCalledWith('shipping')
    expect(screen.getByRole('tab', { name: 'Address' }).getAttribute('aria-selected')).toBe('true')
  })

  it('does not change step on click by default', () => {
    const onValueChange = vi.fn<(...args: Array<any>) => void>()
    const screen = render(() => (
      <Stepper items={ITEMS} defaultValue="address" onValueChange={onValueChange} />
    ))

    fireEvent.click(screen.getByRole('tab', { name: 'Shipping' }))

    expect(onValueChange).not.toHaveBeenCalled()
    expect(screen.getByRole('tab', { name: 'Address' }).getAttribute('aria-selected')).toBe('true')
  })

  it('blocks skipping ahead in linear navigation', () => {
    const onValueChange = vi.fn<(...args: Array<any>) => void>()
    const screen = render(() => (
      <Stepper
        items={ITEMS}
        defaultValue="address"
        onValueChange={onValueChange}
        navigation="linear"
      />
    ))

    const checkout = screen.getByRole('tab', { name: 'Checkout' })
    fireEvent.click(checkout)

    expect(checkout.getAttribute('disabled')).toBe('')
    expect(onValueChange).not.toHaveBeenCalled()
    expect(screen.getByText('Address content')).not.toBeNull()
  })

  it('allows returning to completed steps in linear navigation', () => {
    const onValueChange = vi.fn<(...args: Array<any>) => void>()
    const screen = render(() => (
      <Stepper
        items={ITEMS}
        defaultValue="checkout"
        onValueChange={onValueChange}
        navigation="linear"
      />
    ))

    fireEvent.click(screen.getByRole('tab', { name: 'Address' }))

    expect(onValueChange).toHaveBeenCalledWith('address')
    expect(screen.getByRole('tab', { name: 'Address' }).getAttribute('aria-selected')).toBe('true')
  })

  it('allows jumping ahead in free navigation', () => {
    const onValueChange = vi.fn<(...args: Array<any>) => void>()
    const screen = render(() => (
      <Stepper
        items={ITEMS}
        defaultValue="address"
        navigation="free"
        onValueChange={onValueChange}
      />
    ))

    fireEvent.click(screen.getByRole('tab', { name: 'Checkout' }))

    expect(onValueChange).toHaveBeenCalledWith('checkout')
  })

  it('disables later duplicate items so they cannot be selected', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const onValueChange = vi.fn<(...args: Array<any>) => void>()
    const screen = render(() => (
      <Stepper
        navigation="free"
        defaultValue="first"
        onValueChange={onValueChange}
        items={[
          { value: 'first', label: 'First', content: 'First panel' },
          { value: 'dup', label: 'Second', content: 'Second panel' },
          { value: 'dup', label: 'Third', content: 'Third panel' },
        ]}
      />
    ))

    const second = screen.getByRole<HTMLButtonElement>('tab', { name: 'Second' })
    const third = screen.getByRole<HTMLButtonElement>('tab', { name: 'Third' })
    expect(second.disabled).toBe(false)
    expect(third.disabled).toBe(true)

    fireEvent.click(third)
    expect(onValueChange).not.toHaveBeenCalled()
    expect(third.getAttribute('aria-selected')).toBe('false')

    fireEvent.click(second)
    expect(onValueChange).toHaveBeenCalledWith('dup')
    expect(second.getAttribute('aria-selected')).toBe('true')
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('duplicate item value "dup"'))
    warn.mockRestore()
  })

  it('does not wrap from the last step to the first on ArrowRight', () => {
    const onValueChange = vi.fn<(...args: Array<any>) => void>()
    const screen = render(() => (
      <Stepper
        items={ITEMS}
        defaultValue="checkout"
        navigation="free"
        onValueChange={onValueChange}
      />
    ))

    const checkout = screen.getByRole('tab', { name: 'Checkout' })
    checkout.focus()

    fireEvent.keyDown(checkout, { key: 'ArrowRight' })

    expect(onValueChange).not.toHaveBeenCalled()
    expect(checkout.getAttribute('aria-selected')).toBe('true')
    expect(screen.getByRole('tab', { name: 'Address' }).getAttribute('aria-selected')).toBe('false')
  })

  it('wraps from the last step to the first on ArrowRight when loop=true', () => {
    const onValueChange = vi.fn<(...args: Array<any>) => void>()
    const screen = render(() => (
      <Stepper
        items={ITEMS}
        defaultValue="checkout"
        navigation="free"
        loop
        onValueChange={onValueChange}
      />
    ))

    const checkout = screen.getByRole('tab', { name: 'Checkout' })
    checkout.focus()

    fireEvent.keyDown(checkout, { key: 'ArrowRight' })

    expect(onValueChange).toHaveBeenCalledWith('address')
    expect(screen.getByRole('tab', { name: 'Address' }).getAttribute('aria-selected')).toBe('true')
  })

  it('flips horizontal arrows from the provider without a dir attribute', () => {
    const previousDirection = document.documentElement.getAttribute('dir')
    document.documentElement.removeAttribute('dir')
    const onValueChange = vi.fn<(...args: Array<any>) => void>()
    try {
      const screen = render(() => (
        <MoraineProvider dir="rtl">
          <Stepper
            items={ITEMS}
            defaultValue="shipping"
            navigation="free"
            onValueChange={onValueChange}
          />
        </MoraineProvider>
      ))

      const shipping = screen.getByRole('tab', { name: 'Shipping' })
      shipping.focus()
      fireEvent.keyDown(shipping, { key: 'ArrowLeft' })
      expect(onValueChange).toHaveBeenCalledWith('checkout')
      expect(shipping.closest('[dir]')).toBeNull()
    } finally {
      if (previousDirection === null) {
        document.documentElement.removeAttribute('dir')
      } else {
        document.documentElement.setAttribute('dir', previousDirection)
      }
    }
  })

  it('supports Home and End keyboard navigation in free navigation', () => {
    const onValueChange = vi.fn<(...args: Array<any>) => void>()
    const screen = render(() => (
      <Stepper
        items={ITEMS}
        defaultValue="shipping"
        navigation="free"
        onValueChange={onValueChange}
      />
    ))

    const shipping = screen.getByRole('tab', { name: 'Shipping' })
    const address = screen.getByRole('tab', { name: 'Address' })
    const checkout = screen.getByRole('tab', { name: 'Checkout' })

    shipping.focus()
    fireEvent.keyDown(shipping, { key: 'End' })
    expect(checkout.getAttribute('aria-selected')).toBe('true')

    fireEvent.keyDown(checkout, { key: 'Home' })
    expect(address.getAttribute('aria-selected')).toBe('true')
    expect(onValueChange).toHaveBeenCalledWith('checkout')
    expect(onValueChange).toHaveBeenCalledWith('address')
  })

  it('supports manual activation mode via Enter', () => {
    const onValueChange = vi.fn<(...args: Array<any>) => void>()
    const screen = render(() => (
      <Stepper
        items={ITEMS}
        defaultValue="address"
        navigation="free"
        activationMode="manual"
        onValueChange={onValueChange}
      />
    ))

    const address = screen.getByRole('tab', { name: 'Address' })
    const shipping = screen.getByRole('tab', { name: 'Shipping' })

    address.focus()
    fireEvent.keyDown(address, { key: 'ArrowRight' })

    expect(document.activeElement).toBe(shipping)
    expect(shipping.getAttribute('aria-selected')).toBe('false')

    fireEvent.keyDown(shipping, { key: 'Enter' })

    expect(shipping.getAttribute('aria-selected')).toBe('true')
    expect(onValueChange).toHaveBeenCalledWith('shipping')
  })

  it('applies orientation to the tablist and class overrides to their slots', () => {
    const screen = render(() => (
      <MoraineProvider>
        <Stepper
          items={ITEMS}
          orientation="vertical"
          classes={{
            root: 'root-override',
            trigger: 'trigger-override',
            content: 'content-override',
          }}
        />
      </MoraineProvider>
    ))

    const root = screen.container.querySelector('[data-slot="stepper"]')
    const trigger = screen.container.querySelector('[data-slot="stepper-trigger"]')
    const content = screen.container.querySelector('[data-slot="stepper-content"]')

    expect(screen.getByRole('tablist').getAttribute('aria-orientation')).toBe('vertical')
    expect(root?.className).toContain('root-override')
    expect(trigger?.className).toContain('trigger-override')
    expect(content?.className).toContain('content-override')
  })

  it('updates aria-orientation on orientation change without remounting steps', () => {
    const [orientation, setOrientation] = createSignal<'horizontal' | 'vertical'>('horizontal')
    const screen = render(() => <Stepper items={ITEMS} orientation={orientation()} />)
    const indicator = screen.container.querySelector<HTMLElement>(
      '[data-slot="stepper-indicator"]',
    )!

    expect(screen.getByRole('tablist').getAttribute('aria-orientation')).toBe('horizontal')
    flush(() => setOrientation('vertical'))
    expect(screen.getByRole('tablist').getAttribute('aria-orientation')).toBe('vertical')
    expect(screen.container.querySelector('[data-slot="stepper-indicator"]')).toBe(indicator)
  })

  it('selects through the label and description and reports each step state', () => {
    const screen = render(() => <Stepper items={ITEMS} navigation="linear" />)
    const triggers = screen.getAllByRole('tab')
    const label = screen.getByText('Shipping')
    const description = screen.getByText('Confirm your order')
    expect(triggers[1]!.contains(label)).toBe(true)
    expect(triggers[2]!.contains(description)).toBe(true)
    fireEvent.click(label)
    expect(triggers[1]!.getAttribute('aria-selected')).toBe('true')
    fireEvent.click(description)
    expect(triggers[2]!.getAttribute('aria-selected')).toBe('true')
    const states = Array.from(
      screen.container.querySelectorAll('[data-slot="stepper-indicator"]'),
    ).map((element) => element.getAttribute('data-state'))
    expect(states).toEqual(['completed', 'completed', 'active'])
    expect(screen.container.querySelectorAll('[data-slot="stepper-separator"]')).toHaveLength(2)
  })

  it('omits empty text wrappers and the connector for a single step', () => {
    const screen = render(() => <Stepper items={[{ value: 'single' }]} />)
    expect(screen.container.querySelector('[data-slot="stepper-wrapper"]')).toBeNull()
    expect(screen.container.querySelector('[data-slot="stepper-separator"]')).toBeNull()
    expect(screen.getByRole('tab').textContent).toBe('1')
    // The step number is plain text, not an icon hidden from assistive technology.
    expect(screen.container.querySelector('[data-slot="stepper-icon"]')).toBeNull()
    expect(
      screen.container.querySelector('[data-slot="stepper-indicator"] [aria-hidden]'),
    ).toBeNull()
  })

  it('renders icon indicators', () => {
    const screen = render(() => (
      <Stepper
        items={[
          {
            value: 'inbox',
            label: 'Inbox',
            icon: 'icon-inbox',
            content: 'Inbox content',
          },
        ]}
      />
    ))

    expect(screen.container.querySelector('[data-slot="stepper-icon"]')).not.toBeNull()
  })

  it('falls back to the first available step when defaultValue is invalid', () => {
    const screen = render(() => (
      <Stepper
        items={[{ ...ITEMS[0], disabled: true }, { ...ITEMS[1] }, { ...ITEMS[2] }]}
        defaultValue="missing"
      />
    ))

    expect(screen.getByRole('tab', { name: 'Shipping' }).getAttribute('aria-selected')).toBe('true')
    expect(screen.getByRole('tabpanel').textContent).toContain('Shipping content')
  })

  it('falls back to the first available step when value is invalid', () => {
    const screen = render(() => (
      <Stepper
        items={[{ ...ITEMS[0], disabled: true }, { ...ITEMS[1] }, { ...ITEMS[2] }]}
        value="missing"
        navigation="linear"
      />
    ))

    expect(screen.getByRole('tab', { name: 'Shipping' }).getAttribute('aria-selected')).toBe('true')
    expect(screen.getByRole('tabpanel').textContent).toContain('Shipping content')
  })

  it('keeps the no-request fallback dynamic until the user selects a step', () => {
    const [items, setItems] = createSignal<Array<StepperT.Item>>([
      { ...ITEMS[0], disabled: true },
      { ...ITEMS[1] },
      { ...ITEMS[2] },
    ])
    const screen = render(() => <Stepper items={items()} navigation="free" />)

    expect(screen.getByRole('tab', { name: 'Shipping' }).getAttribute('aria-selected')).toBe('true')

    flush(() => setItems([{ ...ITEMS[0] }, { ...ITEMS[1] }, { ...ITEMS[2] }]))
    expect(screen.getByRole('tab', { name: 'Address' }).getAttribute('aria-selected')).toBe('true')

    fireEvent.click(screen.getByRole('tab', { name: 'Shipping' }))
    setItems([
      { label: 'Account', value: 'account', content: 'Account content' },
      { ...ITEMS[0] },
      { ...ITEMS[1] },
      { ...ITEMS[2] },
    ])
    expect(screen.getByRole('tab', { name: 'Shipping' }).getAttribute('aria-selected')).toBe('true')
  })

  it('restores preserved uncontrolled step state after controlled mode is removed', () => {
    const [value, setValue] = createSignal<string | undefined>()
    const screen = render(() => <Stepper items={ITEMS} value={value()} navigation="free" />)

    fireEvent.click(screen.getByRole('tab', { name: 'Shipping' }))
    expect(screen.getByRole('tab', { name: 'Shipping' }).getAttribute('aria-selected')).toBe('true')

    flush(() => setValue('address'))
    expect(screen.getByRole('tab', { name: 'Address' }).getAttribute('aria-selected')).toBe('true')

    flush(() => setValue(undefined))
    expect(screen.getByRole('tab', { name: 'Shipping' }).getAttribute('aria-selected')).toBe('true')
  })

  it('applies style overrides', () => {
    const screen = render(() => (
      <Stepper
        items={ITEMS}
        styles={{
          root: { width: '200px' },
          trigger: { width: '200px' },
          content: { width: '200px' },
        }}
      />
    ))

    const root = screen.container.querySelector<HTMLElement>('[data-slot="stepper"]')
    const trigger = screen.container.querySelector<HTMLElement>('[data-slot="stepper-trigger"]')
    const content = screen.container.querySelector<HTMLElement>('[data-slot="stepper-content"]')

    expect(root?.style.width).toBe('200px')
    expect(trigger?.style.width).toBe('200px')
    expect(content?.style.width).toBe('200px')
  })

  it('provides aria-owns on tablist and aria-current="step" on active tab', () => {
    const screen = render(() => <Stepper items={ITEMS} value="shipping" />)
    const tablist = screen.getByRole('tablist')
    const tabs = screen.getAllByRole('tab')
    const activeTab = screen.getByRole('tab', { name: 'Shipping' })

    const expectedOwns = tabs.map((t) => t.id).join(' ')
    expect(tablist.getAttribute('aria-owns')).toBe(expectedOwns)
    expect(activeTab.getAttribute('aria-current')).toBe('step')

    const inactiveTab = screen.getByRole('tab', { name: 'Address' })
    expect(inactiveTab.getAttribute('aria-current')).toBeNull()
  })

  it('associates aria-labelledby when title is 0', () => {
    const screen = render(() => (
      <Stepper
        items={[
          { value: 'zero', label: 0, content: 'Zero panel' },
          { value: 'one', label: 1, content: 'One panel' },
        ]}
      />
    ))
    const tab = screen.getByRole('tab', { name: '0' })
    expect(tab.getAttribute('aria-labelledby')).not.toBeNull()
  })

  it('renders item.content as a component receiving { value, index }', () => {
    const CustomContent = (props: { value: string; index: number }) => (
      <div data-testid="custom-content">
        Value: {props.value}, Index: {props.index}
      </div>
    )

    const screen = render(() => (
      <Stepper
        value="custom"
        items={[
          { value: 'custom', label: 'Custom', content: CustomContent },
          { value: 'other', label: 'Other', content: 'Other Content' },
        ]}
      />
    ))

    const content = screen.getByTestId('custom-content')
    expect(content.textContent).toBe('Value: custom, Index: 0')
  })

  it('warns in DEV on missing or duplicate item value', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    render(() => (
      <Stepper
        items={[
          { value: 'dup', label: 'One' },
          { value: 'dup', label: 'Two' },
          // @ts-expect-error missing value for testing DEV warning
          { label: 'Three' },
        ]}
      />
    ))

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Stepper received duplicate item value "dup"'),
    )
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Stepper item at index 2 is missing a required "value"'),
    )

    warnSpy.mockRestore()
  })
})
