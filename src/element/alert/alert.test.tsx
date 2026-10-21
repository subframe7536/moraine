import { fireEvent, render } from '@solidjs/testing-library'
import { createSignal } from 'solid-js'
import { describe, expect, it, vi } from 'vitest'

import { Alert } from './alert'

describe('Alert', () => {
  it('renders primary alert with title and no icon by default', () => {
    const screen = render(() => <Alert title="Primary announcement" />)
    const alert = screen.getByRole('status')
    expect(alert).toBeDefined()
    expect(alert.getAttribute('data-slot')).toBe('alert')
    expect(alert.getAttribute('data-type')).toBe('primary')
    expect(screen.getByText('Primary announcement')).toBeDefined()
    expect(alert.querySelector('[data-slot="alert-icon"]')).toBeNull()
  })

  it('renders secondary alert with title and no icon', () => {
    const screen = render(() => <Alert type="secondary" title="Secondary announcement" />)
    const alert = screen.getByRole('status')
    expect(alert).toBeDefined()
    expect(alert.getAttribute('data-slot')).toBe('alert')
    expect(alert.getAttribute('data-type')).toBe('secondary')
    expect(screen.getByText('Secondary announcement')).toBeDefined()
    expect(alert.querySelector('[data-slot="alert-icon"]')).toBeNull()
  })

  it('renders semantic status types with default icons and appropriate ARIA roles', () => {
    const viewInfo = render(() => <Alert type="info" title="Info alert" />)
    let alert = viewInfo.getByRole('status')
    expect(alert.getAttribute('data-type')).toBe('info')
    expect(alert.querySelector('[data-slot="alert-icon"] [data-slot="icon"]')?.className).toContain(
      'icon-info',
    )
    viewInfo.unmount()

    const viewSuccess = render(() => <Alert type="success" title="Success alert" />)
    alert = viewSuccess.getByRole('status')
    expect(alert.getAttribute('data-type')).toBe('success')
    expect(alert.querySelector('[data-slot="alert-icon"] [data-slot="icon"]')?.className).toContain(
      'icon-success',
    )
    viewSuccess.unmount()

    const viewWarning = render(() => <Alert type="warning" title="Warning alert" />)
    alert = viewWarning.getByRole('alert')
    expect(alert.getAttribute('data-type')).toBe('warning')
    expect(alert.querySelector('[data-slot="alert-icon"] [data-slot="icon"]')?.className).toContain(
      'icon-warning',
    )
    viewWarning.unmount()

    const viewError = render(() => <Alert type="error" title="Error alert" />)
    alert = viewError.getByRole('alert')
    expect(alert.getAttribute('data-type')).toBe('error')
    expect(alert.querySelector('[data-slot="alert-icon"] [data-slot="icon"]')?.className).toContain(
      'icon-error',
    )
    viewError.unmount()
  })

  it('allows suppressing the icon with icon={false} or icon={null}', () => {
    const view1 = render(() => <Alert type="info" title="No icon" icon={false} />)
    expect(view1.getByRole('status').querySelector('[data-slot="alert-icon"]')).toBeNull()
    view1.unmount()

    const view2 = render(() => <Alert type="success" title="No icon either" icon={null} />)
    expect(view2.getByRole('status').querySelector('[data-slot="alert-icon"]')).toBeNull()
    view2.unmount()
  })

  it('supports custom icon names and custom JSX elements', () => {
    const view1 = render(() => <Alert type="primary" title="With custom icon" icon="icon-tip" />)
    const alert = view1.getByRole('status')
    expect(alert.querySelector('[data-slot="alert-icon"] [data-slot="icon"]')?.className).toContain(
      'icon-tip',
    )
    view1.unmount()

    const view2 = render(() => (
      <Alert type="info" title="Custom JSX icon" icon={<span data-testid="custom-icon">★</span>} />
    ))
    expect(view2.getByTestId('custom-icon')).toBeDefined()
    view2.unmount()
  })

  it('renders description and applies multi-line layout styles', () => {
    const screen = render(() => (
      <Alert title="Alert heading" description="Detailed description message providing context." />
    ))
    const alert = screen.getByRole('status')
    expect(alert.hasAttribute('data-has-description')).toBe(true)
    expect(screen.getByText('Detailed description message providing context.')).toBeDefined()
    expect(alert.className).toContain('items-start')
  })

  it('renders actions slot alongside alert content', () => {
    const screen = render(() => (
      <Alert title="Update available" actions={<button type="button">Upgrade now</button>} />
    ))
    const alert = screen.getByRole('status')
    expect(screen.getByRole('button', { name: 'Upgrade now' })).toBeDefined()
    const actionsEl = alert.querySelector('[data-slot="alert-actions"]')
    expect(actionsEl).not.toBeNull()
  })

  it('applies fullWidth styles', () => {
    const screen = render(() => <Alert title="Banner notice" fullWidth />)
    const alert = screen.getByRole('status')
    expect(alert.hasAttribute('data-full-width')).toBe(true)
    expect(alert.className).toContain('rounded-none')
  })

  it('renders arbitrary children within content area', () => {
    const screen = render(() => (
      <Alert title="With child content">
        <a href="#link">Learn more</a>
      </Alert>
    ))
    expect(screen.getByRole('link', { name: 'Learn more' })).toBeDefined()
  })

  it('renders close button, uses exit animation classes, and handles dismiss', () => {
    const onOpenChange = vi.fn()
    const onExitComplete = vi.fn()
    const screen = render(() => (
      <Alert
        title="Dismissible alert"
        closable
        onOpenChange={onOpenChange}
        onExitComplete={onExitComplete}
      />
    ))

    const alert = screen.getByRole('status')
    expect(alert.className).toContain('data-closed:animate-mo-exit')

    const closeBtn = screen.getByRole('button', { name: 'Close alert' })
    expect(closeBtn).toBeDefined()
    expect(closeBtn.getAttribute('data-slot')).toBe('alert-close')
    expect(closeBtn.querySelector('[data-slot="icon"]')?.className).toContain('icon-close')

    fireEvent.click(closeBtn)
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('supports custom closeIcon name and element', () => {
    const view1 = render(() => (
      <Alert title="Custom close icon" closable closeIcon="icon-panel-close" />
    ))
    let closeBtn = view1.getByRole('button', { name: 'Close alert' })
    expect(closeBtn.querySelector('[data-slot="icon"]')?.className).toContain('icon-panel-close')
    view1.unmount()

    const view2 = render(() => (
      <Alert
        title="Custom close element"
        closable
        closeIcon={<span data-testid="custom-close">Dismiss</span>}
      />
    ))
    expect(view2.getByRole('button', { name: 'Close alert' })).toBeDefined()
    expect(view2.getByTestId('custom-close')).toBeDefined()
    view2.unmount()
  })

  it('supports controlled open state and exit transition data attribute', () => {
    function ControlledTest() {
      const [open, setOpen] = createSignal(true)
      return (
        <div>
          <button onClick={() => setOpen(false)}>Hide</button>
          <Alert open={open()} title="Controlled alert" />
        </div>
      )
    }

    const screen = render(() => <ControlledTest />)
    expect(screen.getByText('Controlled alert')).toBeDefined()

    fireEvent.click(screen.getByRole('button', { name: 'Hide' }))
    const alert = document.querySelector('[data-slot="alert"]')
    expect(alert?.hasAttribute('data-closed')).toBe(true)
  })

  it('allows overriding ARIA role', () => {
    const screen = render(() => (
      <Alert title="Custom role" role="region" aria-label="Important announcement" />
    ))
    expect(screen.getByRole('region', { name: 'Important announcement' })).toBeDefined()
  })
})
