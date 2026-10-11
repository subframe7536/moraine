import { fireEvent, render, waitFor } from '@solidjs/testing-library'
import { Show, createSignal } from 'solid-js'
import { describe, expect, test, vi } from 'vitest'

import { MoraineProvider } from '../../provider'
import { finishExitMotion } from '../../test-util/overlay-test'

import { AlertDialog } from './alert-dialog'
import type { AlertDialogT } from './alert-dialog.types'

function setup(): void {
  render(() => (
    <>
      <button type="button" data-testid="outside">
        Outside
      </button>
      <AlertDialog />
    </>
  ))
}

function dialogs(): HTMLElement[] {
  return Array.from(document.body.querySelectorAll<HTMLElement>('[role="alertdialog"]'))
}

function dialog(): HTMLElement {
  const element = dialogs()[0]
  if (!element) {
    throw new Error('expected an alert dialog')
  }
  return element
}

function button(name: string, root: ParentNode = document.body): HTMLButtonElement {
  const match = Array.from(root.querySelectorAll('button')).find(
    (candidate) => candidate.textContent === name,
  )
  if (!(match instanceof HTMLButtonElement)) {
    throw new Error(`expected a ${name} button`)
  }
  return match
}

async function waitForDialogCount(count: number): Promise<void> {
  await finishExitMotion()
  await waitFor(() => {
    expect(dialogs()).toHaveLength(count)
  })
}

async function waitForTitle(title: string): Promise<void> {
  await waitFor(() => {
    expect(document.body.querySelector('[data-slot="dialog-title"]')?.textContent).toBe(title)
  })
}

describe('AlertDialog', () => {
  test('requires a mounted host', () => {
    expect(() => AlertDialog.confirm({ title: 'Missing' })).toThrow('Mount <AlertDialog>')
  })

  test('confirms from OK and cancels from the cancel button', async () => {
    setup()
    const onOk = vi.fn()
    const onCancel = vi.fn()
    const confirmed = AlertDialog.confirm({
      title: 'Delete project',
      description: 'This cannot be undone.',
      onOk,
      onCancel,
    })
    await waitForTitle('Delete project')

    expect(dialog().getAttribute('aria-modal')).toBe('true')
    expect(dialog().getAttribute('aria-labelledby')).toBe(
      document.body.querySelector('[data-slot="dialog-title"]')?.id,
    )
    expect(document.body.querySelector('[data-slot="dialog-content-close"]')).toBeNull()
    expect(document.body.querySelector('[data-slot="dialog-title"]')?.textContent).toBe(
      'Delete project',
    )
    expect(document.body.querySelector('[data-slot="dialog-description"]')?.textContent).toBe(
      'This cannot be undone.',
    )
    expect(document.body.querySelector('[data-slot="dialog-body"]')).toBeNull()
    expect(document.body.querySelector('[data-slot="icon"]')).toBeNull()

    fireEvent.click(button('Cancel'))
    await expect(confirmed).resolves.toBe(false)
    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(onOk).not.toHaveBeenCalled()
    await waitForDialogCount(0)

    const accepted = AlertDialog.info({ title: 'Saved', onOk })
    await waitForTitle('Saved')
    fireEvent.click(button('OK'))
    await expect(accepted).resolves.toBe(true)
    expect(onOk).toHaveBeenCalledTimes(1)
    await waitForDialogCount(0)
  })

  test('uses each type icon and shows cancel only for confirm by default', async () => {
    setup()
    const cases: Array<[AlertDialogT.Type, string | undefined, string | undefined, boolean]> = [
      ['confirm', undefined, undefined, true],
      ['info', 'icon-info', 'text-primary', false],
      ['warning', 'icon-warning', 'text-foreground', false],
      ['error', 'icon-error', 'text-destructive', false],
      ['success', 'icon-success', 'text-primary', false],
    ]

    for (const [type, icon, tone, showsCancel] of cases) {
      AlertDialog.destroyAll()
      void AlertDialog[type]({ title: type })
      await waitForTitle(type)
      const iconElement = document.body.querySelector('[data-slot="icon"]')
      if (icon === undefined) {
        expect(iconElement).toBeNull()
      } else {
        expect(iconElement?.className).toContain(icon)
        expect(iconElement?.className).toContain(tone)
      }
      expect(
        Array.from(document.body.querySelectorAll('button')).some(
          (item) => item.textContent === 'Cancel',
        ),
      ).toBe(showsCancel)
    }

    AlertDialog.destroyAll()
    void AlertDialog.confirm({ title: 'Danger confirm', danger: true })
    await waitForTitle('Danger confirm')
    const dangerIcon = document.body.querySelector('[data-slot="icon"]')
    expect(dangerIcon?.className).toContain('icon-caution')
    expect(dangerIcon?.className).toContain('text-destructive')
  })

  test('keeps outside pointer dismissal disabled and still closes on Escape', async () => {
    setup()
    const onCancel = vi.fn()
    const result = AlertDialog.confirm({ title: 'Stay', onCancel })
    await waitForTitle('Stay')

    await new Promise((resolve) => setTimeout(resolve, 0))
    fireEvent.pointerDown(document.body.querySelector('[data-testid="outside"]')!)
    await Promise.resolve()
    expect(onCancel).not.toHaveBeenCalled()
    expect(dialogs()).toHaveLength(1)

    dialog().focus()
    fireEvent.keyDown(dialog(), { key: 'Escape' })
    await expect(result).resolves.toBe(false)
    expect(onCancel).toHaveBeenCalledTimes(1)
    await waitForDialogCount(0)
  })

  test('closes from the overlay when closeOnOverlayClick is set and can block Escape', async () => {
    setup()
    const onCancel = vi.fn()
    const blocked = AlertDialog.info({
      title: 'Info',
      cancel: true,
      closeOnOverlayClick: true,
      closeOnEscape: false,
      onCancel,
    })
    await waitForTitle('Info')

    dialog().focus()
    fireEvent.keyDown(dialog(), { key: 'Escape' })
    await Promise.resolve()
    expect(onCancel).not.toHaveBeenCalled()
    expect(dialogs()).toHaveLength(1)

    await new Promise((resolve) => setTimeout(resolve, 0))
    fireEvent.pointerDown(document.body.querySelector('[data-testid="outside"]')!)
    await expect(blocked).resolves.toBe(false)
    expect(onCancel).toHaveBeenCalledTimes(1)
    await waitForDialogCount(0)
  })

  test('shows loading while an async OK action is pending and stays open when it rejects', async () => {
    setup()
    let rejectOk: (reason?: unknown) => void = () => undefined
    let resolveOk: () => void = () => undefined
    const result = AlertDialog.confirm({
      title: 'Save',
      onOk: () =>
        new Promise<void>((resolve, reject) => {
          resolveOk = resolve
          rejectOk = reject
        }),
    })
    await waitForTitle('Save')
    let settled = false
    void result.then(() => {
      settled = true
    })

    const ok = button('OK')
    fireEvent.click(ok)
    await waitFor(() => {
      expect(ok.hasAttribute('data-loading')).toBe(true)
      expect(ok.getAttribute('aria-busy')).toBe('true')
    })

    rejectOk(new Error('failed'))
    await waitFor(() => {
      expect(ok.hasAttribute('data-loading')).toBe(false)
    })
    expect(settled).toBe(false)
    expect(dialogs()).toHaveLength(1)

    fireEvent.click(ok)
    await waitFor(() => {
      expect(ok.hasAttribute('data-loading')).toBe(true)
    })
    resolveOk()
    await expect(result).resolves.toBe(true)
    await waitForDialogCount(0)
  })

  test('keeps the dialog open when a cancel action rejects', async () => {
    setup()
    const result = AlertDialog.confirm({
      title: 'Keep',
      onCancel: () => Promise.reject(new Error('stay')),
    })
    let settled = false
    void result.then(() => {
      settled = true
    })
    await waitForTitle('Keep')

    fireEvent.click(button('Cancel'))
    await waitFor(() => {
      expect(button('Cancel').hasAttribute('data-loading')).toBe(false)
    })
    expect(settled).toBe(false)
    expect(dialogs()).toHaveLength(1)
  })

  test('updates options, destroys one dialog, and destroys the rest', async () => {
    setup()
    const first = AlertDialog.confirm({ title: 'First', width: 280, class: 'custom-alert' })
    await waitForTitle('First')
    expect(dialog().style.maxWidth).toBe('280px')
    expect(dialog().className).toContain('custom-alert')

    first.update({
      title: 'Updated',
      danger: true,
      close: true,
      icon: null,
      style: { 'max-width': '12rem' },
      width: 280,
    })
    expect(document.body.querySelector('[data-slot="dialog-title"]')?.textContent).toBe('Updated')
    expect(button('OK').className).toContain('bg-destructive')
    expect(document.body.querySelector('.icon-caution')).toBeNull()
    expect(document.body.querySelector('.icon-close')).not.toBeNull()
    expect(document.body.querySelector('[data-slot="dialog-content-close"]')).not.toBeNull()
    expect(dialog().style.maxWidth).toBe('12rem')

    const second = AlertDialog.warning({ title: 'Second', okVariant: 'outline', danger: true })
    await waitFor(() => {
      expect(dialogs()).toHaveLength(2)
    })
    expect(button('OK', dialogs()[1]).className).not.toContain('bg-destructive')

    first.destroy()
    await expect(first).resolves.toBe(false)
    expect(document.body.querySelector('[data-slot="dialog-title"]')?.textContent).toBe('Second')

    AlertDialog.destroyAll()
    await expect(second).resolves.toBe(false)
    expect(dialogs()).toHaveLength(0)
  })

  test('corner close runs onCancel and close resolves false before exit finishes', async () => {
    setup()
    const onCancel = vi.fn()
    const closed = AlertDialog.info({ title: 'Closable', close: true, onCancel })
    await waitFor(() => {
      expect(document.body.querySelector('[data-slot="dialog-content-close"]')).not.toBeNull()
    })
    fireEvent.click(document.body.querySelector('[data-slot="dialog-content-close"]')!)
    await expect(closed).resolves.toBe(false)
    expect(onCancel).toHaveBeenCalledTimes(1)
    await waitForDialogCount(0)

    const animated = AlertDialog.success({ title: 'Animated' })
    await waitForTitle('Animated')
    animated.close()
    await expect(animated).resolves.toBe(false)
    expect(dialogs()).toHaveLength(1)
    await waitForDialogCount(0)
  })

  test('uses dialog messages, an accessible name, and reads each JSX option once', async () => {
    let titleReads = 0
    let descriptionReads = 0

    render(() => (
      <MoraineProvider messages={{ dialog: { ok: '确定', cancel: '取消' } }}>
        <AlertDialog />
      </MoraineProvider>
    ))
    void AlertDialog.confirm({
      get title() {
        titleReads += 1
        return '标题'
      },
      get description() {
        descriptionReads += 1
        return '说明'
      },
    })
    void AlertDialog.info({ ariaLabel: 'Notice', icon: <span data-testid="custom-icon">!</span> })

    await waitFor(() => {
      expect(titleReads).toBe(1)
      expect(descriptionReads).toBe(1)
      expect(button('确定')).toBeInstanceOf(HTMLButtonElement)
      expect(button('取消')).toBeInstanceOf(HTMLButtonElement)
      const named = document.body.querySelector('[aria-label="Notice"]')
      expect(named?.getAttribute('role')).toBe('alertdialog')
      expect(named?.getAttribute('aria-labelledby')).toBeNull()
      expect(document.body.querySelector('[data-testid="custom-icon"]')).not.toBeNull()
    })
  })

  test('hides cancel for confirm and shows it for other types when requested', async () => {
    setup()
    void AlertDialog.confirm({ title: 'No cancel', cancel: false })
    await waitForTitle('No cancel')
    expect(
      Array.from(document.body.querySelectorAll('button')).some(
        (item) => item.textContent === 'Cancel',
      ),
    ).toBe(false)
    AlertDialog.destroyAll()
    void AlertDialog.error({ title: 'With cancel', cancel: true, cancelText: 'Back' })
    await waitFor(() => {
      expect(button('Back')).toBeInstanceOf(HTMLButtonElement)
    })
  })

  test('Escape closes only the top alert dialog', async () => {
    setup()
    const first = AlertDialog.confirm({ title: 'Bottom' })
    const second = AlertDialog.info({ title: 'Top' })
    let firstSettled = false
    void first.then(() => {
      firstSettled = true
    })
    await waitFor(() => {
      expect(dialogs().some((element) => element.textContent?.includes('Top'))).toBe(true)
    })

    const top = dialogs().find((element) => element.textContent?.includes('Top'))
    if (!top) {
      throw new Error('expected the top alert dialog')
    }
    top.focus()
    fireEvent.keyDown(top, { key: 'Escape' })
    await expect(second).resolves.toBe(false)
    expect(firstSettled).toBe(false)
    await finishExitMotion(top)
    await waitFor(() => {
      expect(dialogs()).toHaveLength(1)
    })
    expect(document.body.querySelector('[data-slot="dialog-title"]')?.textContent).toBe('Bottom')
  })

  test('applies host defaults and lets the call override them', async () => {
    render(() => <AlertDialog okText="Continue" cancelText="Back" width={420} danger />)
    void AlertDialog.confirm({ title: 'Defaults' })
    await waitFor(() => {
      expect(button('Continue')).toBeInstanceOf(HTMLButtonElement)
      expect(button('Back')).toBeInstanceOf(HTMLButtonElement)
    })
    expect(dialog().style.maxWidth).toBe('420px')
    expect(button('Continue').className).toContain('bg-destructive')

    AlertDialog.destroyAll()
    void AlertDialog.info({ title: 'Override', okText: 'Done', danger: false })
    await waitFor(() => {
      expect(button('Done')).toBeInstanceOf(HTMLButtonElement)
    })
    expect(button('Done').className).not.toContain('bg-destructive')
    expect(
      Array.from(document.body.querySelectorAll('button')).some(
        (item) => item.textContent === 'Back',
      ),
    ).toBe(false)
  })

  test('centers the layout and paints a subtle footer', async () => {
    setup()
    void AlertDialog.confirm({
      title: 'Allow accessory to connect?',
      description: 'Connect this device?',
      center: true,
      subtle: true,
      danger: true,
      okText: 'Allow',
      cancelText: "Don't allow",
    })
    await waitForTitle('Allow accessory to connect?')

    const footer = document.body.querySelector('[data-slot="dialog-footer"]')
    expect(footer?.className).toContain('bg-muted/50')
    expect(footer?.className).toContain('border-t')
    expect(footer?.className).toContain('flex-row')
    expect(footer?.className).toContain('px-6')
    expect(footer?.className).toContain('pt-4')
    expect(document.body.querySelector('[data-slot="icon"]')?.className).toContain(
      'text-destructive',
    )
    expect(button("Don't allow").className).toContain('flex-1')
    expect(button('Allow').className).toContain('flex-1')
    expect(document.body.querySelector('[data-slot="icon"]')?.parentElement?.className).toContain(
      'bg-muted',
    )
    expect(
      document.body.querySelector('[data-slot="dialog-title"]')?.parentElement?.className,
    ).toContain('text-center')
  })

  test('focuses the first action and restores focus to the opener', async () => {
    const screen = render(() => (
      <>
        <button
          type="button"
          data-testid="open"
          onClick={() => {
            void AlertDialog.confirm({ title: 'Focus' })
          }}
        >
          Open
        </button>
        <AlertDialog />
      </>
    ))
    const opener = screen.getByTestId('open')
    opener.focus()
    fireEvent.click(opener)
    await waitFor(() => {
      expect(document.activeElement).toBe(button('Cancel'))
    })
    fireEvent.click(button('Cancel'))
    await waitForDialogCount(0)
    await waitFor(() => {
      expect(document.activeElement).toBe(opener)
    })
  })

  test('reports a synchronous throw and keeps the dialog open', async () => {
    setup()
    const error = new Error('sync')
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const result = AlertDialog.confirm({
      title: 'Throw',
      onOk: () => {
        throw error
      },
    })
    let settled = false
    void result.then(() => {
      settled = true
    })
    await waitForTitle('Throw')
    fireEvent.click(button('OK'))
    await Promise.resolve()
    expect(spy).toHaveBeenCalledWith(error)
    expect(settled).toBe(false)
    expect(dialogs()).toHaveLength(1)
    spy.mockRestore()
  })

  test('reports a rejected action and keeps the dialog open', async () => {
    setup()
    const error = new Error('async')
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const result = AlertDialog.confirm({
      title: 'Reject',
      onOk: () => Promise.reject(error),
    })
    let settled = false
    void result.then(() => {
      settled = true
    })
    await waitForTitle('Reject')
    fireEvent.click(button('OK'))
    await waitFor(() => {
      expect(spy).toHaveBeenCalledWith(error)
      expect(button('OK').hasAttribute('data-loading')).toBe(false)
    })
    expect(settled).toBe(false)
    expect(dialogs()).toHaveLength(1)
    spy.mockRestore()
  })

  test('disables the other action and Escape while a handler is pending', async () => {
    setup()
    const onCancel = vi.fn()
    let resolveOk: () => void = () => undefined
    const result = AlertDialog.confirm({
      title: 'Pending',
      close: true,
      onCancel,
      onOk: () =>
        new Promise<void>((resolve) => {
          resolveOk = resolve
        }),
    })
    await waitFor(() => {
      expect(document.body.querySelector('[data-slot="dialog-content-close"]')).not.toBeNull()
    })
    fireEvent.click(button('OK'))
    await waitFor(() => {
      expect(button('OK').hasAttribute('data-loading')).toBe(true)
      expect(button('Cancel').disabled).toBe(true)
      expect(document.body.querySelector('[data-slot="dialog-content-close"]')).toBeNull()
    })
    dialog().focus()
    fireEvent.keyDown(dialog(), { key: 'Escape' })
    await Promise.resolve()
    expect(onCancel).not.toHaveBeenCalled()
    expect(dialogs()).toHaveLength(1)
    resolveOk()
    await expect(result).resolves.toBe(true)
    await waitForDialogCount(0)
  })

  test('destroy and close settle false while an action is pending', async () => {
    setup()
    let resolveOk: () => void = () => undefined
    const destroyed = AlertDialog.confirm({
      title: 'Destroy pending',
      onOk: () =>
        new Promise<void>((resolve) => {
          resolveOk = resolve
        }),
    })
    await waitForTitle('Destroy pending')
    fireEvent.click(button('OK'))
    await waitFor(() => {
      expect(button('OK').hasAttribute('data-loading')).toBe(true)
    })
    destroyed.destroy()
    await expect(destroyed).resolves.toBe(false)
    expect(dialogs()).toHaveLength(0)
    resolveOk()

    const closed = AlertDialog.confirm({
      title: 'Close pending',
      onOk: () => new Promise<void>(() => undefined),
    })
    await waitForTitle('Close pending')
    fireEvent.click(button('OK'))
    await waitFor(() => {
      expect(button('OK').hasAttribute('data-loading')).toBe(true)
    })
    closed.close()
    await expect(closed).resolves.toBe(false)
    expect(dialogs()).toHaveLength(1)
    await waitForDialogCount(0)
  })

  test('ignores a second OK click while the first action is pending', async () => {
    setup()
    const onOk = vi.fn(() => new Promise<void>(() => undefined))
    void AlertDialog.confirm({ title: 'Double', onOk })
    await waitForTitle('Double')
    const ok = button('OK')
    fireEvent.click(ok)
    fireEvent.click(ok)
    await waitFor(() => {
      expect(ok.hasAttribute('data-loading')).toBe(true)
    })
    expect(onOk).toHaveBeenCalledTimes(1)
  })

  test('update after close does not reopen the dialog', async () => {
    setup()
    const closed = AlertDialog.info({ title: 'Gone' })
    await waitForTitle('Gone')
    closed.close()
    await expect(closed).resolves.toBe(false)
    closed.update({ title: 'Back' })
    await waitForDialogCount(0)
    expect(document.body.querySelector('[data-slot="dialog-title"]')).toBeNull()
  })

  test('targets a host by id and uses the last mounted host by default', async () => {
    render(() => (
      <>
        <AlertDialog id="first" okText="First OK" />
        <AlertDialog id="second" okText="Second OK" />
      </>
    ))
    void AlertDialog.confirm('first', { title: 'On first' })
    void AlertDialog.info('second', { title: 'On second' })
    await waitFor(() => {
      expect(dialogs()).toHaveLength(2)
    })
    expect(button('First OK')).toBeInstanceOf(HTMLButtonElement)
    expect(button('Second OK')).toBeInstanceOf(HTMLButtonElement)

    AlertDialog.destroyAll('first')
    await waitFor(() => {
      expect(dialogs()).toHaveLength(1)
    })
    expect(document.body.querySelector('[data-slot="dialog-title"]')?.textContent).toBe('On second')

    void AlertDialog.warning({ title: 'Default host' })
    await waitFor(() => {
      expect(dialogs().some((element) => element.textContent?.includes('Default host'))).toBe(true)
    })
    const opened = dialogs().find((element) => element.textContent?.includes('Default host'))
    expect(button('Second OK', opened)).toBeInstanceOf(HTMLButtonElement)
    expect(() => AlertDialog.confirm('missing', { title: 'No' })).toThrow('id="missing"')
  })

  test('settles open dialogs as false when the host unmounts', async () => {
    const [mounted, setMounted] = createSignal(true)
    render(() => (
      <Show when={mounted()}>
        <AlertDialog />
      </Show>
    ))
    const result = AlertDialog.confirm({ title: 'Leaving' })
    await waitForTitle('Leaving')
    setMounted(false)
    await expect(result).resolves.toBe(false)
    expect(dialogs()).toHaveLength(0)
  })

  test('warns in development when title and ariaLabel are both absent', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    setup()
    void AlertDialog.info({})
    await waitFor(() => {
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('accessible name'))
    })
    warn.mockRestore()
  })
})
