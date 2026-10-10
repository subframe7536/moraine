import { fireEvent, render, waitFor } from '@solidjs/testing-library'
import { describe, expect, test, vi } from 'vitest'

import { MoraineProvider } from '../../provider'
import { finishExitMotion } from '../../test-util/overlay-test'

import type { AlertDialogApi, AlertDialogType } from './use-alert-dialog'
import { useAlertDialog } from './use-alert-dialog'

function setup(): { alert: AlertDialogApi } {
  let alert!: AlertDialogApi
  render(() => {
    const [api, Holder] = useAlertDialog()
    alert = api
    return (
      <>
        <button type="button" data-testid="outside">
          Outside
        </button>
        <Holder />
      </>
    )
  })
  return { alert }
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

describe('useAlertDialog', () => {
  test('confirms from OK and cancels from the cancel button', async () => {
    const { alert } = setup()
    const onOk = vi.fn()
    const onCancel = vi.fn()
    const confirmed = alert.confirm({
      title: 'Delete project',
      description: 'This cannot be undone.',
      content: 'All files will be removed.',
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
    expect(document.body.querySelector('[data-slot="dialog-body"]')?.textContent).toBe(
      'All files will be removed.',
    )
    expect(document.body.querySelector('[data-slot="icon"]')?.className).toContain('icon-caution')

    fireEvent.click(button('Cancel'))
    await expect(confirmed).resolves.toBe(false)
    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(onOk).not.toHaveBeenCalled()
    await waitForDialogCount(0)

    const accepted = alert.info({ title: 'Saved', onOk })
    await waitForTitle('Saved')
    fireEvent.click(button('OK'))
    await expect(accepted).resolves.toBe(true)
    expect(onOk).toHaveBeenCalledTimes(1)
    await waitForDialogCount(0)
  })

  test('uses each type icon and shows cancel only for confirm by default', async () => {
    const { alert } = setup()
    const cases: Array<[AlertDialogType, string, string, boolean]> = [
      ['confirm', 'icon-caution', 'text-destructive', true],
      ['info', 'icon-info', 'text-primary', false],
      ['warning', 'icon-warning', 'text-destructive', false],
      ['error', 'icon-error', 'text-destructive', false],
      ['success', 'icon-success', 'text-primary', false],
    ]

    for (const [type, icon, tone, showsCancel] of cases) {
      alert.destroyAll()
      void alert[type]({ title: type })
      await waitForTitle(type)
      const iconElement = document.body.querySelector('[data-slot="icon"]')
      expect(iconElement?.className).toContain(icon)
      expect(iconElement?.className).toContain(tone)
      expect(
        Array.from(document.body.querySelectorAll('button')).some(
          (item) => item.textContent === 'Cancel',
        ),
      ).toBe(showsCancel)
    }
  })

  test('keeps outside pointer dismissal disabled and still closes on Escape', async () => {
    const { alert } = setup()
    const onCancel = vi.fn()
    const result = alert.confirm({ title: 'Stay', onCancel })
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

  test('closes from the mask when maskClosable is set and can block Escape', async () => {
    const { alert } = setup()
    const onCancel = vi.fn()
    const blocked = alert.info({
      title: 'Info',
      cancel: true,
      maskClosable: true,
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
    const { alert } = setup()
    let rejectOk: (reason?: unknown) => void = () => undefined
    let resolveOk: () => void = () => undefined
    const result = alert.confirm({
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
    const { alert } = setup()
    const result = alert.confirm({
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
    const { alert } = setup()
    const first = alert.confirm({ title: 'First', width: 280, class: 'custom-alert' })
    await waitForTitle('First')
    expect(dialog().style.maxWidth).toBe('280px')
    expect(dialog().className).toContain('custom-alert')

    first.update({
      title: 'Updated',
      danger: true,
      closable: true,
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

    const second = alert.warning({ title: 'Second', okVariant: 'outline', danger: true })
    await waitFor(() => {
      expect(dialogs()).toHaveLength(2)
    })
    expect(button('OK', dialogs()[1]).className).not.toContain('bg-destructive')

    first.destroy()
    await expect(first).resolves.toBe(false)
    expect(document.body.querySelector('[data-slot="dialog-title"]')?.textContent).toBe('Second')

    alert.destroyAll()
    await expect(second).resolves.toBe(false)
    expect(dialogs()).toHaveLength(0)
  })

  test('close resolves false after the exit transition and the corner button runs onCancel', async () => {
    const { alert } = setup()
    const onCancel = vi.fn()
    const closed = alert.info({ title: 'Closable', closable: true, onCancel })
    await waitFor(() => {
      expect(document.body.querySelector('[data-slot="dialog-content-close"]')).not.toBeNull()
    })
    fireEvent.click(document.body.querySelector('[data-slot="dialog-content-close"]')!)
    await expect(closed).resolves.toBe(false)
    expect(onCancel).toHaveBeenCalledTimes(1)
    await waitForDialogCount(0)

    const animated = alert.success({ title: 'Animated' })
    await waitForTitle('Animated')
    animated.close()
    await expect(animated).resolves.toBe(false)
    expect(dialogs()).toHaveLength(1)
    await waitForDialogCount(0)
  })

  test('uses dialog messages, an accessible name, and reads each JSX option once', async () => {
    let titleReads = 0
    let contentReads = 0

    render(() => {
      const [alert, Holder] = useAlertDialog()
      void alert.confirm({
        get title() {
          titleReads += 1
          return '标题'
        },
        get content() {
          contentReads += 1
          return '正文'
        },
      })
      void alert.info({ ariaLabel: 'Notice', icon: <span data-testid="custom-icon">!</span> })
      return (
        <MoraineProvider messages={{ dialog: { ok: '确定', cancel: '取消' } }}>
          <Holder />
        </MoraineProvider>
      )
    })

    await waitFor(() => {
      expect(titleReads).toBe(1)
      expect(contentReads).toBe(1)
      expect(button('确定')).toBeInstanceOf(HTMLButtonElement)
      expect(button('取消')).toBeInstanceOf(HTMLButtonElement)
      const named = document.body.querySelector('[aria-label="Notice"]')
      expect(named?.getAttribute('role')).toBe('alertdialog')
      expect(named?.getAttribute('aria-labelledby')).toBeNull()
      expect(document.body.querySelector('[data-testid="custom-icon"]')).not.toBeNull()
    })
  })

  test('hides cancel for confirm and shows it for other types when requested', async () => {
    const { alert } = setup()
    void alert.confirm({ title: 'No cancel', cancel: false })
    await waitForTitle('No cancel')
    expect(
      Array.from(document.body.querySelectorAll('button')).some(
        (item) => item.textContent === 'Cancel',
      ),
    ).toBe(false)
    alert.destroyAll()
    void alert.error({ title: 'With cancel', cancel: true, cancelText: 'Back' })
    await waitFor(() => {
      expect(button('Back')).toBeInstanceOf(HTMLButtonElement)
    })
  })

  test('Escape closes only the top alert dialog', async () => {
    const { alert } = setup()
    const first = alert.confirm({ title: 'Bottom' })
    const second = alert.info({ title: 'Top' })
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
})
