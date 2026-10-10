import type { Component, JSX } from 'solid-js'
import { Show, createComponent, createSignal, createUniqueId, onCleanup } from 'solid-js'

import type { ButtonT } from '../../element/button'
import type { IconT } from '../../element/icon'

import type { DialogT } from './dialog.types'

export type AlertDialogType = 'confirm' | 'info' | 'warning' | 'error' | 'success'

export interface AlertDialogOptions {
  /** Accessible name used when `title` is absent. */
  ariaLabel?: string
  /** Shows the cancel action. Defaults to true for `confirm` and false otherwise. */
  cancel?: boolean
  cancelText?: JSX.Element
  cancelVariant?: ButtonT.Variant['variant']
  class?: string
  classes?: DialogT.Classes
  /**
   * Whether Escape dismisses the dialog.
   * @default true
   */
  closeOnEscape?: boolean
  /**
   * Whether the corner close button is shown.
   * @default false
   */
  closable?: boolean
  content?: JSX.Element
  /** Styles the OK action as `destructive` when `okVariant` is omitted. */
  danger?: boolean
  description?: JSX.Element
  /** Replaces the type icon. `null` omits the icon. */
  icon?: IconT.Name | null
  /**
   * Whether an outside pointer press dismisses the dialog.
   * @default false
   */
  maskClosable?: boolean
  okText?: JSX.Element
  /**
   * Visual treatment of the OK action.
   * @default 'default'
   */
  okVariant?: ButtonT.Variant['variant']
  /** Called before the dialog closes from a cancel or dismiss gesture. A rejection leaves it open. */
  onCancel?: () => void | Promise<unknown>
  /** Called before the dialog closes from the OK action. A rejection leaves it open. */
  onOk?: () => void | Promise<unknown>
  style?: JSX.CSSProperties
  styles?: DialogT.Styles
  title?: JSX.Element
  /** Sets the dialog content `max-width`. */
  width?: string | number
}

export interface AlertDialogInstance extends Promise<boolean> {
  /** Resolves `false` and plays the exit transition. */
  close: () => void
  /** Resolves `false` and removes the dialog immediately. */
  destroy: () => void
  update: (options: Partial<AlertDialogOptions>) => void
}

export interface AlertDialogApi {
  confirm: (options: AlertDialogOptions) => AlertDialogInstance
  info: (options: AlertDialogOptions) => AlertDialogInstance
  warning: (options: AlertDialogOptions) => AlertDialogInstance
  error: (options: AlertDialogOptions) => AlertDialogInstance
  success: (options: AlertDialogOptions) => AlertDialogInstance
  destroyAll: () => void
}

export interface AlertDialogRecord {
  accept: () => Promise<void> | void
  dismiss: () => Promise<void> | void
  id: string
  open: () => boolean
  options: () => AlertDialogOptions
  remove: () => void
  setOpen: (open: boolean) => void
  settle: (value: boolean) => void
  type: AlertDialogType
  update: (options: Partial<AlertDialogOptions>) => void
}

type AlertDialogViewComponent = Component<{ dialogs: () => AlertDialogRecord[] }>

// Dialog rendering stays out of this module so Node can import `moraine/utils`.
let alertDialogView: Promise<AlertDialogViewComponent> | undefined

function loadAlertDialogView(): Promise<AlertDialogViewComponent> {
  alertDialogView ??= import('./alert-dialog-view').then((module) => module.AlertDialogView)
  return alertDialogView
}

function isPromiseLike(value: unknown): value is PromiseLike<unknown> {
  return (
    (typeof value === 'object' || typeof value === 'function') &&
    value !== null &&
    typeof (value as PromiseLike<unknown>).then === 'function'
  )
}

function createAlertDialog(
  type: AlertDialogType,
  options: AlertDialogOptions,
): {
  instance: AlertDialogInstance
  record: AlertDialogRecord
} {
  const [open, setOpen] = createSignal(true)
  const [currentOptions, setCurrentOptions] = createSignal(options)
  let settled = false
  let pending: Promise<void> | undefined
  let resolveResult: (value: boolean) => void = () => undefined
  const result = new Promise<boolean>((resolve) => {
    resolveResult = resolve
  })
  const settle = (value: boolean): void => {
    if (settled) {
      return
    }
    settled = true
    resolveResult(value)
  }
  const finish = (confirmed: boolean): void => {
    if (settled) {
      return
    }
    settle(confirmed)
    setOpen(false)
  }
  const runAction = (confirmed: boolean): Promise<void> | void => {
    if (settled || pending) {
      return
    }
    const action = confirmed ? currentOptions().onOk : currentOptions().onCancel
    let outcome: unknown
    try {
      outcome = action?.()
    } catch {
      return
    }
    if (!isPromiseLike(outcome)) {
      finish(confirmed)
      return
    }
    const task = Promise.resolve(outcome)
      .then(() => {
        finish(confirmed)
      })
      .catch(() => undefined)
      .finally(() => {
        if (pending === task) {
          pending = undefined
        }
      })
    pending = task
    return task
  }
  const update = (next: Partial<AlertDialogOptions>): void => {
    setCurrentOptions((current) => ({ ...current, ...next }))
  }
  const record: AlertDialogRecord = {
    accept: () => runAction(true),
    dismiss: () => runAction(false),
    id: `alert-dialog-${createUniqueId()}`,
    open,
    options: currentOptions,
    remove: () => undefined,
    setOpen,
    settle,
    type,
    update,
  }
  const instance: AlertDialogInstance = Object.assign(result, {
    close: () => {
      settle(false)
      setOpen(false)
    },
    destroy: () => {
      settle(false)
      record.remove()
    },
    update,
  })
  return { instance, record }
}

function AlertDialogHolder(props: { dialogs: () => AlertDialogRecord[] }): JSX.Element {
  const [view, setView] = createSignal<AlertDialogViewComponent>()
  let active = true
  onCleanup(() => {
    active = false
  })
  void loadAlertDialogView().then((component) => {
    if (active) {
      setView(() => component)
    }
  })
  return Show({
    keyed: true,
    get when(): AlertDialogViewComponent | undefined {
      return view()
    },
    children: (component) => createComponent(component, props),
  })
}

/** Imperative alert dialogs rendered through `Dialog`. Mount the returned holder beside the caller. */
export function useAlertDialog(): [AlertDialogApi, () => JSX.Element] {
  const [dialogs, setDialogs] = createSignal<AlertDialogRecord[]>([])
  const removeDialog = (id: string): void => {
    setDialogs((current) => current.filter((item) => item.id !== id))
  }
  const openDialog = (type: AlertDialogType, options: AlertDialogOptions): AlertDialogInstance => {
    const { instance, record } = createAlertDialog(type, options)
    record.remove = () => removeDialog(record.id)
    setDialogs((current) => [...current, record])
    return instance
  }
  const api: AlertDialogApi = {
    confirm: (options) => openDialog('confirm', options),
    info: (options) => openDialog('info', options),
    warning: (options) => openDialog('warning', options),
    error: (options) => openDialog('error', options),
    success: (options) => openDialog('success', options),
    destroyAll: () => {
      for (const item of dialogs()) {
        item.settle(false)
      }
      setDialogs([])
    },
  }
  void loadAlertDialogView()

  return [api, () => createComponent(AlertDialogHolder, { dialogs })]
}
