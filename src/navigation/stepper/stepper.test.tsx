import { fireEvent, render } from '@solidjs/testing-library'
import { createSignal } from 'solid-js'
import { describe, expect, test, vi } from 'vitest'

import { createDesign } from '../../design.ts'
import { MoraineProvider } from '../../shared/provider/index.ts'

import { Stepper } from './stepper'

test('reads JSX fields once and delays the inactive panel', () => {
  const reads = { title: 0, description: 0, content: 0 }
  const [value, setValue] = createSignal('first')
  const view = render(() => (
    <Stepper
      value={value()}
      items={[
        { value: 'first', title: 'First' },
        {
          value: 'second',
          get title() {
            reads.title++
            return <span>Second</span>
          },
          get description() {
            reads.description++
            return <span>Description</span>
          },
          get content() {
            reads.content++
            return <span>Panel</span>
          },
        },
      ]}
    />
  ))
  expect(reads).toEqual({ title: 1, description: 1, content: 0 })
  setValue('second')
  expect(view.getByRole('tabpanel').textContent).toBe('Panel')
  expect(reads).toEqual({ title: 1, description: 1, content: 1 })
})

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

describe('Stepper', () => {
  const ITEMS = [
    {
      title: 'Address',
      description: 'Add your address here',
      value: 'address',
      content: 'Address content',
    },
    {
      title: 'Shipping',
      description: 'Set your preferred shipping method',
      value: 'shipping',
      content: 'Shipping content',
    },
    {
      title: 'Checkout',
      description: 'Confirm your order',
      value: 'checkout',
      content: 'Checkout content',
    },
  ]

  test('renders step triggers and current content', () => {
    const screen = render(() => <Stepper items={ITEMS} defaultValue="address" />)

    expect(screen.getByRole('tab', { name: 'Address' })).not.toBeNull()
    expect(screen.getByRole('tab', { name: 'Shipping' })).not.toBeNull()
    expect(screen.getByText('Address content')).not.toBeNull()
    expect(screen.getByRole('tabpanel').textContent).toContain('Address content')
  })

  test('renders tabpanel content for the selected step', () => {
    const screen = render(() => (
      <Stepper items={ITEMS} defaultValue="address" linear={false} clickable />
    ))

    const getSelectedPanel = () =>
      screen.container.querySelector('[data-slot="content"][data-selected]')

    expect(getSelectedPanel()?.textContent).toContain('Address content')

    fireEvent.click(screen.getByRole('tab', { name: 'Shipping' }))

    expect(getSelectedPanel()?.textContent).toContain('Shipping content')
  })

  test('supports controlled value and emits onChange with item value', () => {
    const onChange = vi.fn()

    const screen = render(() => (
      <Stepper items={ITEMS} value="address" onChange={onChange} clickable />
    ))

    fireEvent.click(screen.getByRole('tab', { name: 'Shipping' }))

    expect(onChange).toHaveBeenCalledWith('shipping')
    expect(screen.getByRole('tab', { name: 'Address' }).getAttribute('aria-selected')).toBe('true')
  })

  test('does not change step on click by default', () => {
    const onChange = vi.fn()
    const screen = render(() => (
      <Stepper items={ITEMS} defaultValue="address" onChange={onChange} />
    ))

    fireEvent.click(screen.getByRole('tab', { name: 'Shipping' }))

    expect(onChange).not.toHaveBeenCalled()
    expect(screen.getByRole('tab', { name: 'Address' }).getAttribute('aria-selected')).toBe('true')
  })

  test('blocks skipping ahead when linear is enabled', () => {
    const onChange = vi.fn()
    const screen = render(() => (
      <Stepper items={ITEMS} defaultValue="address" onChange={onChange} clickable />
    ))

    const checkout = screen.getByRole('tab', { name: 'Checkout' })
    fireEvent.click(checkout)

    expect(checkout.getAttribute('disabled')).toBe('')
    expect(onChange).not.toHaveBeenCalled()
    expect(screen.getByText('Address content')).not.toBeNull()
  })

  test('allows jumping ahead when linear is disabled', () => {
    const onChange = vi.fn()
    const screen = render(() => (
      <Stepper items={ITEMS} defaultValue="address" linear={false} onChange={onChange} clickable />
    ))

    fireEvent.click(screen.getByRole('tab', { name: 'Checkout' }))

    expect(onChange).toHaveBeenCalledWith('checkout')
  })

  test('does not wrap from the last step to the first on ArrowRight', () => {
    const onChange = vi.fn()
    const screen = render(() => (
      <Stepper items={ITEMS} defaultValue="checkout" linear={false} onChange={onChange} clickable />
    ))

    const checkout = screen.getByRole('tab', { name: 'Checkout' })
    checkout.focus()

    fireEvent.keyDown(checkout, { key: 'ArrowRight' })

    expect(onChange).not.toHaveBeenCalled()
    expect(checkout.getAttribute('aria-selected')).toBe('true')
    expect(screen.getByRole('tab', { name: 'Address' }).getAttribute('aria-selected')).toBe('false')
  })

  test('supports Home and End keyboard navigation when clickable', () => {
    const onChange = vi.fn()
    const screen = render(() => (
      <Stepper items={ITEMS} defaultValue="shipping" linear={false} clickable onChange={onChange} />
    ))

    const shipping = screen.getByRole('tab', { name: 'Shipping' })
    const address = screen.getByRole('tab', { name: 'Address' })
    const checkout = screen.getByRole('tab', { name: 'Checkout' })

    shipping.focus()
    fireEvent.keyDown(shipping, { key: 'End' })
    expect(checkout.getAttribute('aria-selected')).toBe('true')

    fireEvent.keyDown(checkout, { key: 'Home' })
    expect(address.getAttribute('aria-selected')).toBe('true')
    expect(onChange).toHaveBeenCalledWith('checkout')
    expect(onChange).toHaveBeenCalledWith('address')
  })

  test('supports manual activation mode via Enter', () => {
    const onChange = vi.fn()
    const screen = render(() => (
      <Stepper
        items={ITEMS}
        defaultValue="address"
        linear={false}
        clickable
        activationMode="manual"
        onChange={onChange}
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
    expect(onChange).toHaveBeenCalledWith('shipping')
  })

  test('applies orientation classes and slot overrides', () => {
    const screen = render(() => (
      <MoraineProvider design={createDesign()}>
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

    const root = screen.container.querySelector('[data-slot="root"]')
    const container = screen.container.querySelector('[data-slot="container"]')
    const trigger = screen.container.querySelector('[data-slot="trigger"]')
    const separator = screen.container.querySelector('[data-slot="separator"]')
    const content = screen.container.querySelector('[data-slot="content"]')

    expect(root?.className).toContain('flex-row')
    expect(container?.className).toContain('self-stretch')
    expect(root?.className).toContain('root-override')
    expect(trigger?.className).toContain('trigger-override')
    expect(separator?.className).toContain('-bottom-3')
    expect(content?.className).toContain('content-override')
  })

  test('uses stepper css variable helper classes for size and separator layout', () => {
    const screen = render(() => (
      <MoraineProvider design={createDesign()}>
        <Stepper items={ITEMS} size="lg" orientation="vertical" />
      </MoraineProvider>
    ))

    const root = screen.container.querySelector('[data-slot="root"]') as HTMLElement
    const separator = screen.container.querySelector('[data-slot="separator"]')

    expect(root?.className).toContain('[--st-size:calc(var(--spacing)*10)]')
    expect(separator?.className).toContain('-bottom-3')
  })

  test('omits default visual styles without a provider and preserves activation', () => {
    const screen = render(() => <Stepper items={ITEMS} clickable linear={false} />)
    for (const element of screen.container.querySelectorAll('[data-slot]')) {
      expect(element.className).toBe('')
    }
    expect(screen.container.querySelector('[data-slot="root"]')?.getAttribute('style')).toBeNull()
    fireEvent.click(screen.getByRole('tab', { name: 'Shipping' }))
    expect(screen.getByRole('tabpanel').textContent).toContain('Shipping content')
  })

  test('renders icon indicators', () => {
    const screen = render(() => (
      <Stepper
        items={[
          {
            title: 'Inbox',
            icon: 'icon-inbox',
            content: 'Inbox content',
          },
        ]}
      />
    ))

    expect(screen.container.querySelector('[data-slot="icon"]')).not.toBeNull()
  })

  test('falls back to the first available step when defaultValue is invalid', () => {
    const screen = render(() => (
      <Stepper
        items={[{ ...ITEMS[0], disabled: true }, { ...ITEMS[1] }, { ...ITEMS[2] }]}
        defaultValue="missing"
      />
    ))

    expect(screen.getByRole('tab', { name: 'Shipping' }).getAttribute('aria-selected')).toBe('true')
    expect(screen.getByRole('tabpanel').textContent).toContain('Shipping content')
  })

  test('falls back to the first available step when value is invalid', () => {
    const screen = render(() => (
      <Stepper
        items={[{ ...ITEMS[0], disabled: true }, { ...ITEMS[1] }, { ...ITEMS[2] }]}
        value="missing"
        clickable
      />
    ))

    expect(screen.getByRole('tab', { name: 'Shipping' }).getAttribute('aria-selected')).toBe('true')
    expect(screen.getByRole('tabpanel').textContent).toContain('Shipping content')
  })

  test('applies style overrides', () => {
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

    const root = screen.container.querySelector<HTMLElement>('[data-slot="root"]')
    const trigger = screen.container.querySelector<HTMLElement>('[data-slot="trigger"]')
    const content = screen.container.querySelector<HTMLElement>('[data-slot="content"]')

    expect(root?.style.width).toBe('200px')
    expect(trigger?.style.width).toBe('200px')
    expect(content?.style.width).toBe('200px')
  })
})
