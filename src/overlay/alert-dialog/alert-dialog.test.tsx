import { fireEvent, render, waitFor } from '@solidjs/testing-library'
import { Show, createRoot, createSignal } from 'solid-js'
import { describe, expect, test, vi } from 'vitest'

import { Button } from '../../element/button'
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
    (candidate) => candidate.textContent === name || candidate.getAttribute('aria-label') === name,
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

  test('resolves action from OK and cancel from the cancel button', async () => {
    setup()
    const onAction = vi.fn()
    const onCancel = vi.fn()
    const confirmed = AlertDialog.confirm({
      title: 'Delete project',
      description: 'This cannot be undone.',
      action: { onClick: onAction },
      cancel: { onClick: onCancel },
    })
    expect('then' in confirmed).toBe(false)
    await waitForTitle('Delete project')

    expect(dialog().getAttribute('aria-modal')).toBe('true')
    expect(dialog().getAttribute('aria-labelledby')).toBe(
      document.body.querySelector('[data-slot="dialog-title"]')?.id,
    )
    expect(document.body.querySelector('[data-slot="dialog-content-close"]')).toBeNull()
    expect(document.body.querySelector('[data-slot="dialog-description"]')?.textContent).toBe(
      'This cannot be undone.',
    )

    fireEvent.click(button('Cancel'))
    await expect(confirmed.result()).resolves.toBe('cancel')
    expect(confirmed.result()).toBe(confirmed.result())
    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(onAction).not.toHaveBeenCalled()
    await waitForDialogCount(0)

    const accepted = AlertDialog.info({ title: 'Saved', action: { onClick: onAction } })
    await waitForTitle('Saved')
    fireEvent.click(button('OK'))
    await expect(accepted.result()).resolves.toBe('action')
    expect(onAction).toHaveBeenCalledTimes(1)
    await waitForDialogCount(0)
  })

  test('uses each type icon and shows cancel only for confirm by default', async () => {
    setup()
    const cases: Array<['info' | 'warning' | 'error' | 'success', string, string]> = [
      ['info', 'icon-info', 'text-info'],
      ['warning', 'icon-warning', 'text-warning'],
      ['error', 'icon-error', 'text-danger'],
      ['success', 'icon-success', 'text-success'],
    ]

    void AlertDialog.confirm({ title: 'confirm' })
    await waitForTitle('confirm')
    expect(document.body.querySelector('[data-slot="icon"]')).toBeNull()
    expect(button('Cancel')).toBeInstanceOf(HTMLButtonElement)
    AlertDialog.close()
    await waitForDialogCount(0)

    for (const [type, icon, tone] of cases) {
      void AlertDialog[type]({ title: type })
      await waitForTitle(type)
      const iconElement = document.body.querySelector('[data-slot="icon"]')
      expect(iconElement?.className).toContain(icon)
      expect(iconElement?.className).toContain(tone)
      expect(
        Array.from(document.body.querySelectorAll('button')).some(
          (item) => item.textContent === 'Cancel',
        ),
      ).toBe(false)
      AlertDialog.close()
      await waitForDialogCount(0)
    }

    void AlertDialog.confirm({ title: 'Danger confirm', danger: true })
    await waitForTitle('Danger confirm')
    const dangerIcon = document.body.querySelector('[data-slot="icon"]')
    expect(dangerIcon?.className).toContain('icon-caution')
    expect(dangerIcon?.className).toContain('text-danger')
    expect(button('OK').className).toContain('bg-danger')

    AlertDialog.close()
    await waitForDialogCount(0)
    void AlertDialog.info({ title: 'Custom info icon', icon: 'icon-star' })
    await waitForTitle('Custom info icon')
    const customInfoIcon = document.body.querySelector('[data-slot="icon"]')
    expect(customInfoIcon?.className).toContain('icon-star')
    expect(customInfoIcon?.className).not.toContain('text-info')
  })

  test('keeps outside pointer dismissal disabled and still closes on Escape', async () => {
    setup()
    const onClose = vi.fn()
    const result = AlertDialog.confirm({ title: 'Stay', onClose })
    await waitForTitle('Stay')

    await new Promise((resolve) => setTimeout(resolve, 0))
    fireEvent.pointerDown(document.body.querySelector('[data-testid="outside"]')!)
    await Promise.resolve()
    expect(onClose).not.toHaveBeenCalled()
    expect(dialogs()).toHaveLength(1)

    dialog().focus()
    fireEvent.keyDown(dialog(), { key: 'Escape' })
    await expect(result.result()).resolves.toBe('dismiss')
    expect(onClose).toHaveBeenCalledWith('dismiss')
    await waitForDialogCount(0)
  })

  test('closes from the overlay when closeOnOverlayClick is set and can block Escape', async () => {
    setup()
    const onClose = vi.fn()
    const blocked = AlertDialog.info({
      title: 'Info',
      cancel: true,
      closeOnOverlayClick: true,
      closeOnEscape: false,
      onClose,
    })
    await waitForTitle('Info')

    dialog().focus()
    fireEvent.keyDown(dialog(), { key: 'Escape' })
    await Promise.resolve()
    expect(onClose).not.toHaveBeenCalled()
    expect(dialogs()).toHaveLength(1)

    await new Promise((resolve) => setTimeout(resolve, 0))
    fireEvent.pointerDown(document.body.querySelector('[data-testid="outside"]')!)
    await expect(blocked.result()).resolves.toBe('dismiss')
    expect(onClose).toHaveBeenCalledTimes(1)
    await waitForDialogCount(0)
  })

  test('shows loading while an async action is pending and stays open when it rejects', async () => {
    setup()
    let rejectAction: (reason?: unknown) => void = () => undefined
    let resolveAction: () => void = () => undefined
    const result = AlertDialog.confirm({
      title: 'Pending',
      action: {
        onClick: () =>
          new Promise<void>((resolve, reject) => {
            resolveAction = resolve
            rejectAction = reject
          }),
      },
    })
    await waitForTitle('Pending')
    fireEvent.click(button('OK'))
    await waitFor(() => {
      expect(button('OK').hasAttribute('data-loading')).toBe(true)
    })
    expect(button('Cancel').disabled).toBe(true)

    rejectAction(new Error('nope'))
    await waitFor(() => {
      expect(button('OK').hasAttribute('data-loading')).toBe(false)
    })
    expect(dialogs()).toHaveLength(1)

    fireEvent.click(button('OK'))
    await waitFor(() => {
      expect(button('OK').hasAttribute('data-loading')).toBe(true)
    })
    resolveAction()
    await expect(result.result()).resolves.toBe('action')
    await waitForDialogCount(0)
  })

  test('keeps the dialog open when a cancel action rejects or calls preventDefault', async () => {
    setup()
    const rejected = AlertDialog.confirm({
      title: 'Reject cancel',
      cancel: {
        onClick: () => Promise.reject(new Error('keep')),
      },
    })
    await waitForTitle('Reject cancel')
    fireEvent.click(button('Cancel'))
    await waitFor(() => {
      expect(button('Cancel').hasAttribute('data-loading')).toBe(false)
    })
    expect(dialogs()).toHaveLength(1)
    AlertDialog.close()
    await expect(rejected.result()).resolves.toBe('api')
    await waitForDialogCount(0)

    const prevented = AlertDialog.confirm({
      title: 'Prevented',
      action: {
        onClick: (event) => {
          event?.preventDefault()
        },
      },
    })
    await waitForTitle('Prevented')
    fireEvent.click(button('OK'))
    await Promise.resolve()
    expect(dialogs()).toHaveLength(1)
    prevented.close()
  })

  test('updates options, closes one dialog, and closes the rest', async () => {
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
    expect(button('OK').className).toContain('bg-danger')
    expect(document.body.querySelector('.icon-caution')).toBeNull()
    expect(document.body.querySelector('[data-slot="dialog-content-close"]')).not.toBeNull()
    expect(dialog().style.maxWidth).toBe('12rem')

    const second = AlertDialog.warning({
      title: 'Second',
      danger: true,
      action: { variant: 'outline' },
    })
    await waitFor(() => {
      expect(dialogs()).toHaveLength(2)
    })
    expect(button('OK', dialogs()[1]).className).not.toContain('bg-danger')

    first.close()
    await expect(first.result()).resolves.toBe('api')
    expect(dialogs().length).toBeGreaterThan(0)
    await waitForDialogCount(1)
    expect(document.body.querySelector('[data-slot="dialog-title"]')?.textContent).toBe('Second')

    AlertDialog.close()
    await expect(second.result()).resolves.toBe('api')
    await waitForDialogCount(0)
  })

  test('corner close dismisses without running cancel, and close settles before exit finishes', async () => {
    setup()
    const onCancel = vi.fn()
    const onClose = vi.fn()
    const closed = AlertDialog.info({
      title: 'Closable',
      close: true,
      cancel: { onClick: onCancel },
      onClose,
    })
    await waitFor(() => {
      expect(document.body.querySelector('[data-slot="dialog-content-close"]')).not.toBeNull()
    })
    fireEvent.click(button('Close'))
    await expect(closed.result()).resolves.toBe('dismiss')
    expect(onCancel).not.toHaveBeenCalled()
    expect(onClose).toHaveBeenCalledWith('dismiss')
    await waitForDialogCount(0)

    const animated = AlertDialog.success({ title: 'Animated' })
    await waitForTitle('Animated')
    animated.close()
    await expect(animated.result()).resolves.toBe('api')
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

  test('hides cancel for confirm and shows it for other methods when requested', async () => {
    setup()
    void AlertDialog.confirm({ title: 'No cancel', cancel: false })
    await waitForTitle('No cancel')
    expect(
      Array.from(document.body.querySelectorAll('button')).some(
        (item) => item.textContent === 'Cancel',
      ),
    ).toBe(false)
    AlertDialog.close()
    await waitForDialogCount(0)
    void AlertDialog.error({ title: 'With cancel', cancel: { label: 'Back' } })
    await waitFor(() => {
      expect(button('Back')).toBeInstanceOf(HTMLButtonElement)
    })
  })

  test('Escape closes only the top alert dialog', async () => {
    setup()
    const first = AlertDialog.confirm({ title: 'Bottom' })
    const second = AlertDialog.info({ title: 'Top' })
    let firstSettled = false
    void first.result().then(() => {
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
    await expect(second.result()).resolves.toBe('dismiss')
    expect(firstSettled).toBe(false)
    await finishExitMotion(top)
    await waitFor(() => {
      expect(dialogs()).toHaveLength(1)
    })
    expect(document.body.querySelector('[data-slot="dialog-title"]')?.textContent).toBe('Bottom')
  })

  test('applies live host defaults and lets the call override them', async () => {
    const [width, setWidth] = createSignal(420)
    render(() => <AlertDialog width={width()} danger close />)
    void AlertDialog.confirm({ title: 'Defaults' })
    await waitForTitle('Defaults')
    expect(dialog().style.maxWidth).toBe('420px')
    expect(button('OK').className).toContain('bg-danger')
    expect(document.body.querySelector('[data-slot="dialog-content-close"]')).not.toBeNull()

    setWidth(240)
    await waitFor(() => {
      expect(dialog().style.maxWidth).toBe('240px')
    })

    AlertDialog.close()
    await waitForDialogCount(0)
    void AlertDialog.info({
      title: 'Override',
      danger: false,
      close: false,
      action: { label: 'Done' },
    })
    await waitFor(() => {
      expect(button('Done')).toBeInstanceOf(HTMLButtonElement)
    })
    expect(button('Done').className).not.toContain('bg-danger')
    expect(document.body.querySelector('[data-slot="dialog-content-close"]')).toBeNull()
    expect(
      Array.from(document.body.querySelectorAll('button')).some(
        (item) => item.textContent === 'Cancel',
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
      action: { label: 'Allow' },
      cancel: { label: "Don't allow" },
    })
    await waitForTitle('Allow accessory to connect?')

    const footer = document.body.querySelector('[data-slot="dialog-footer"]')
    expect(footer?.className).toContain('bg-muted/50')
    expect(footer?.className).toContain('border-t')
    expect(footer?.className).toContain('flex-row')
    expect(footer?.className).toContain('p-4')
    expect(document.body.querySelector('[data-slot="icon"]')?.className).toContain('text-danger')
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
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const result = AlertDialog.confirm({
      title: 'Throws',
      action: {
        onClick: () => {
          throw new Error('sync')
        },
      },
    })
    await waitForTitle('Throws')
    fireEvent.click(button('OK'))
    await Promise.resolve()
    expect(error).toHaveBeenCalled()
    expect(dialogs()).toHaveLength(1)
    expect(button('OK').hasAttribute('data-loading')).toBe(false)
    result.close()
    error.mockRestore()
  })

  test('reports a rejected action and keeps the dialog open', async () => {
    setup()
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    AlertDialog.confirm({
      title: 'Rejects',
      action: { onClick: () => Promise.reject(new Error('async')) },
    })
    await waitForTitle('Rejects')
    fireEvent.click(button('OK'))
    await waitFor(() => {
      expect(error).toHaveBeenCalled()
    })
    expect(dialogs()).toHaveLength(1)
    error.mockRestore()
  })

  test('disables the other action and Escape while a handler is pending', async () => {
    setup()
    let resolveAction: () => void = () => undefined
    AlertDialog.confirm({
      title: 'Busy',
      action: {
        onClick: () =>
          new Promise<void>((resolve) => {
            resolveAction = resolve
          }),
      },
    })
    await waitForTitle('Busy')
    fireEvent.click(button('OK'))
    await waitFor(() => {
      expect(button('Cancel').disabled).toBe(true)
    })
    dialog().focus()
    fireEvent.keyDown(dialog(), { key: 'Escape' })
    await Promise.resolve()
    expect(dialogs()).toHaveLength(1)
    resolveAction()
    await waitFor(() => {
      expect(dialog().hasAttribute('data-closed')).toBe(true)
    })
    await waitForDialogCount(0)
  })

  test('close settles api while an action is pending', async () => {
    setup()
    let resolveAction: () => void = () => undefined
    const result = AlertDialog.confirm({
      title: 'Busy close',
      action: {
        onClick: () =>
          new Promise<void>((resolve) => {
            resolveAction = resolve
          }),
      },
    })
    await waitForTitle('Busy close')
    fireEvent.click(button('OK'))
    await waitFor(() => {
      expect(button('OK').hasAttribute('data-loading')).toBe(true)
    })
    result.close()
    await expect(result.result()).resolves.toBe('api')
    resolveAction()
    await waitForDialogCount(0)
  })

  test('ignores a second OK click while the first action is pending', async () => {
    setup()
    const onAction = vi.fn(
      () =>
        new Promise<void>(() => {
          // stays pending
        }),
    )
    AlertDialog.confirm({ title: 'Once', action: { onClick: onAction } })
    await waitForTitle('Once')
    fireEvent.click(button('OK'))
    fireEvent.click(button('OK'))
    await waitFor(() => {
      expect(onAction).toHaveBeenCalledTimes(1)
    })
  })

  test('update after close does not reopen the dialog', async () => {
    setup()
    const result = AlertDialog.info({ title: 'Gone' })
    await waitForTitle('Gone')
    result.close()
    result.update({ title: 'Back' })
    await waitForDialogCount(0)
    expect(document.body.textContent).not.toContain('Back')
    await expect(result.result()).resolves.toBe('api')
  })

  test('targets a host by id and sends calls without host to the host without an id', async () => {
    render(() => (
      <>
        <AlertDialog />
        <AlertDialog id="first" />
      </>
    ))
    const targeted = AlertDialog.info({ host: 'first', title: 'First host' })
    const latest = AlertDialog.info({ title: 'Second host' })
    await waitFor(() => {
      expect(document.body.textContent).toContain('First host')
      expect(document.body.textContent).toContain('Second host')
    })
    AlertDialog.close(targeted.id)
    await waitForDialogCount(1)
    expect(document.body.textContent).toContain('Second host')
    latest.close()
    await waitForDialogCount(0)
  })

  test('throws when only hosts with an id are mounted and the call omits host', () => {
    render(() => <AlertDialog id="only" />)
    expect(() => AlertDialog.show({ title: 'Nowhere' })).toThrow(
      'Mount <AlertDialog> before calling AlertDialog.',
    )
  })

  test('settles open dialogs as api when the host unmounts', async () => {
    const [mounted, setMounted] = createSignal(true)
    render(() => (
      <Show when={mounted()}>
        <AlertDialog />
      </Show>
    ))
    const result = AlertDialog.confirm({ title: 'Unmount' })
    await waitForTitle('Unmount')
    setMounted(false)
    await expect(result.result()).resolves.toBe('api')
    expect(dialogs()).toHaveLength(0)
  })

  test('warns in development when title and ariaLabel are both absent', async () => {
    setup()
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    AlertDialog.info({})
    await waitFor(() => {
      expect(warn).toHaveBeenCalledWith(
        '[moraine] AlertDialog has no accessible name. Pass title or ariaLabel.',
      )
    })
    warn.mockRestore()
  })

  test('warns in development when a duplicate host id is mounted', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    render(() => (
      <>
        <AlertDialog id="same" />
        <AlertDialog id="same" />
      </>
    ))
    expect(warn).toHaveBeenCalledWith(
      '[moraine] Duplicate <AlertDialog id="same">. The last mounted host takes precedence.',
    )
    warn.mockRestore()
  })

  test('preserves reactivity and lifecycle when opened inside a disposed effect owner', async () => {
    setup()
    let opened: AlertDialogT.Handle | undefined
    createRoot((dispose) => {
      dispose()
      opened = AlertDialog.confirm({ title: 'Disposed owner' })
    })
    await waitForTitle('Disposed owner')
    opened?.update({ title: 'Still reactive' })
    await waitForTitle('Still reactive')
    fireEvent.click(button('OK'))
    await expect(opened?.result()).resolves.toBe('action')
  })

  test('custom render receives options and shares action semantics, and dialogRender is the fallback', async () => {
    const dialogRender = vi.fn((props: AlertDialogT.RenderProps) => (
      <p data-testid="host-render">{props.options.title}</p>
    ))
    render(() => <AlertDialog dialogRender={dialogRender} />)

    const custom = AlertDialog.custom(
      (props) => (
        <>
          <h2 id={props.titleId}>{props.options.title}</h2>
          <Button
            onClick={() => {
              props.update({ title: 'Renamed' })
            }}
          >
            Rename
          </Button>
          <Button onClick={(event) => void props.action(event)}>Delete</Button>
        </>
      ),
      {
        title: 'Delete repository?',
        action: {
          onClick: () => undefined,
        },
      },
    )
    await waitFor(() => {
      expect(document.body.querySelector('h2')?.textContent).toBe('Delete repository?')
    })
    expect(dialogRender).not.toHaveBeenCalled()
    expect(dialog().getAttribute('aria-labelledby')).toBe(document.body.querySelector('h2')?.id)

    fireEvent.click(button('Rename'))
    await waitFor(() => {
      expect(document.body.querySelector('h2')?.textContent).toBe('Renamed')
    })
    fireEvent.click(button('Delete'))
    await expect(custom.result()).resolves.toBe('action')
    await waitForDialogCount(0)

    AlertDialog.show({ title: 'From host' })
    await waitFor(() => {
      expect(document.body.querySelector('[data-testid="host-render"]')?.textContent).toBe(
        'From host',
      )
    })
  })

  test('reopening an id during the exit keeps the new dialog and routes updates to it', async () => {
    setup()
    const first = AlertDialog.show({ id: 'reuse', title: 'Old' })
    await waitForTitle('Old')
    first.close()
    const second = AlertDialog.show({ id: 'reuse', title: 'New' })
    expect(second).not.toBe(first)
    AlertDialog.update('reuse', { title: 'Updated' })
    await waitForDialogCount(1)
    expect(document.body.querySelector('[data-slot="dialog-title"]')?.textContent).toBe('Updated')
    let settled = false
    void second.result().then(() => {
      settled = true
    })
    await Promise.resolve()
    expect(settled).toBe(false)
    AlertDialog.close('reuse')
    await expect(second.result()).resolves.toBe('api')
    await waitForDialogCount(0)
  })

  test('reusing an open id with another method replaces the dialog', async () => {
    setup()
    const shown = AlertDialog.show({ id: 'swap', title: 'Shown' })
    await waitForTitle('Shown')
    const same = AlertDialog.show({ id: 'swap', title: 'Same method' })
    expect(same).toBe(shown)
    const confirmed = AlertDialog.confirm({ id: 'swap', title: 'Confirm' })
    expect(confirmed).not.toBe(shown)
    await expect(shown.result()).resolves.toBe('api')
    await waitForDialogCount(1)
    expect(button('Cancel')).toBeTruthy()
    confirmed.close()
    await waitForDialogCount(0)
  })

  test('calls onClose with api when the host unmounts', async () => {
    const [mounted, setMounted] = createSignal(true)
    render(() => (
      <Show when={mounted()}>
        <AlertDialog />
      </Show>
    ))
    const onClose = vi.fn()
    const result = AlertDialog.show({ title: 'Gone', onClose })
    await waitForTitle('Gone')
    setMounted(false)
    await expect(result.result()).resolves.toBe('api')
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(onClose).toHaveBeenCalledWith('api')
  })

  test('closes every dialog on one host with close({ host })', async () => {
    render(() => (
      <>
        <AlertDialog id="a" />
        <AlertDialog id="b" />
      </>
    ))
    const a1 = AlertDialog.show({ host: 'a', title: 'A1' })
    const a2 = AlertDialog.show({ host: 'a', title: 'A2' })
    const b1 = AlertDialog.show({ host: 'b', title: 'B1' })
    await waitFor(() => {
      expect(dialogs()).toHaveLength(3)
    })
    AlertDialog.close({ host: 'a' })
    await expect(a1.result()).resolves.toBe('api')
    await expect(a2.result()).resolves.toBe('api')
    await waitForDialogCount(1)
    expect(document.body.textContent).toContain('B1')
    AlertDialog.close({ host: 'b', id: 'missing' })
    await waitForDialogCount(1)
    b1.close()
    await waitForDialogCount(0)
  })

  test('safely handles null target in close without throwing or closing dialogs', async () => {
    setup()
    const alert = AlertDialog.show({ title: 'Keep open' })
    await waitForTitle('Keep open')
    expect(() => AlertDialog.close(null as unknown as undefined)).not.toThrow()
    expect(dialogs()).toHaveLength(1)
    alert.close()
    await waitForDialogCount(0)
  })

  test('gives the cancel and action buttons distinct slots', async () => {
    setup()
    const result = AlertDialog.confirm({
      title: 'Slots',
      cancel: { class: 'cancel-extra' },
      action: { class: 'action-extra' },
    })
    await waitForTitle('Slots')
    const cancel = document.body.querySelector('[data-slot="alert-dialog-cancel"]')
    const action = document.body.querySelector('[data-slot="alert-dialog-action"]')
    expect(cancel?.textContent).toBe('Cancel')
    expect(cancel?.className).toContain('cancel-extra')
    expect(action?.textContent).toBe('OK')
    expect(action?.className).toContain('action-extra')
    expect(document.body.querySelectorAll('[data-slot="alert-dialog-action"]')).toHaveLength(1)
    result.close()
    await waitForDialogCount(0)
  })
})
