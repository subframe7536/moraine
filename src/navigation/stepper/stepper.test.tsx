import { fireEvent, render } from '@solidjs/testing-library'
import { describe, expect, test, vi } from 'vitest'

import { Stepper } from './stepper'

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

  test('applies orientation classes and slot overrides', () => {
    const screen = render(() => (
      <Stepper
        items={ITEMS}
        orientation="vertical"
        classes={{
          root: 'root-override',
          trigger: 'trigger-override',
          content: 'content-override',
        }}
      />
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
    expect(separator?.className).toContain('bottom--3')
    expect(content?.className).toContain('content-override')
  })

  test('uses stepper css variable helper classes for size and separator layout', () => {
    const screen = render(() => <Stepper items={ITEMS} size="lg" orientation="vertical" />)

    const item = screen.container.querySelector('[data-slot="item"]')
    const separator = screen.container.querySelector('[data-slot="separator"]')

    expect(item?.className).toContain('var-stepper-9-8-3-1')
    expect(separator?.className).toContain('bottom--3')
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
        styles={
          {
            root: { width: '200px' },
            trigger: { width: '200px' },
            content: { width: '200px' },
          } as any
        }
      />
    ))

    const root = screen.container.querySelector('[data-slot="root"]') as HTMLElement | null
    const trigger = screen.container.querySelector('[data-slot="trigger"]') as HTMLElement | null
    const content = screen.container.querySelector('[data-slot="content"]') as HTMLElement | null

    expect(root?.style.width).toBe('200px')
    expect(trigger?.style.width).toBe('200px')
    expect(content?.style.width).toBe('200px')
  })
})
