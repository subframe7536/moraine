import { createMemo, createSignal, createUniqueId } from 'solid-js'

import { createActionRunner } from '../base/feedback/action-runner'
import type { FeedbackAction, FeedbackCloseReason } from '../base/feedback/feedback.types'
import { createCloseResult } from '../base/feedback/handle'
import { mergeDefined, pickDefined } from '../base/feedback/merge-defined'

import type { AlertDialogT } from './alert-dialog.types'

export interface AlertDialogHostDefaults {
  close?: boolean
  closeOnEscape?: boolean
  closeOnOverlayClick?: boolean
  center?: boolean | null
  subtle?: boolean | null
  danger?: boolean | null
  type?: AlertDialogT.Type
  width?: string | number
  class?: AlertDialogT.Options['class']
  classes?: AlertDialogT.Options['classes']
  style?: AlertDialogT.Options['style']
  styles?: AlertDialogT.Options['styles']
}

export interface AlertDialogRecord {
  id: AlertDialogT.Id
  mode: 'confirm' | 'standard'
  render?: AlertDialogT.Render
  options: () => AlertDialogT.Options
  open: () => boolean
  pending: () => 'action' | 'cancel' | undefined
  presentation: AlertDialogT.RenderProps
  handle: AlertDialogT.Handle
  /** Resolves `api` without playing an exit. Used when the host unmounts. */
  abandon: () => void
  remove: () => void
}

function mergeSlots<T extends object>(
  fallback: T | undefined,
  override: T | undefined,
): T | undefined {
  if (fallback === undefined) {
    return override
  }
  if (override === undefined) {
    return fallback
  }
  return mergeDefined(fallback, override)
}

function actionOf(value: AlertDialogT.Options['action']): FeedbackAction | undefined {
  return value
}

function cancelActionOf(value: AlertDialogT.Options['cancel']): FeedbackAction | undefined {
  if (!value || typeof value === 'boolean') {
    return undefined
  }
  return value
}

export function createAlertDialogRecord(
  mode: 'confirm' | 'standard',
  initial: AlertDialogT.Options,
  host: () => AlertDialogHostDefaults,
  render?: AlertDialogT.Render,
): AlertDialogRecord {
  const id = initial.id ?? `alert-dialog-${createUniqueId()}`
  const titleId = createUniqueId()
  const descriptionId = createUniqueId()
  const [current, setCurrent] = createSignal(initial)
  const [open, setOpen] = createSignal(true)
  const result = createCloseResult()
  const title = createMemo(() => current().title)
  const description = createMemo(() => current().description)
  const icon = createMemo(() => current().icon)

  const options = (): AlertDialogT.Options => {
    const call = current()
    const defaults = host()
    return {
      id,
      host: call.host,
      get title() {
        return title()
      },
      get description() {
        return description()
      },
      get icon() {
        return icon()
      },
      get action() {
        return call.action
      },
      get cancel() {
        return call.cancel
      },
      ariaLabel: call.ariaLabel,
      onClose: call.onClose,
      type: call.type ?? defaults.type ?? 'default',
      close: pickDefined(call.close, defaults.close),
      closeOnEscape: pickDefined(call.closeOnEscape, defaults.closeOnEscape),
      closeOnOverlayClick: pickDefined(call.closeOnOverlayClick, defaults.closeOnOverlayClick),
      center: pickDefined(call.center, defaults.center),
      subtle: pickDefined(call.subtle, defaults.subtle),
      danger: pickDefined(call.danger, defaults.danger),
      width: pickDefined(call.width, defaults.width),
      class: pickDefined(call.class, defaults.class),
      classes: mergeSlots(defaults.classes, call.classes),
      style: pickDefined(call.style, defaults.style),
      styles: mergeSlots(defaults.styles, call.styles),
    }
  }

  const finish = (reason: FeedbackCloseReason): void => {
    if (!result.settle(reason)) {
      return
    }
    const notify = options().onClose
    setOpen(false)
    notify?.(reason)
  }

  const runner = createActionRunner({
    closed: () => !open(),
    onFinish: (kind) => finish(kind),
  })

  const update = (next: AlertDialogT.UpdateOptions): void => {
    if (!open()) {
      return
    }
    setCurrent((call) => mergeDefined(call, next))
  }

  const presentation: AlertDialogT.RenderProps = {
    id,
    get options() {
      return options()
    },
    pending: runner.pending,
    action: (event) => runner.run('action', event, actionOf(options().action)?.onClick),
    cancel: (event) => runner.run('cancel', event, cancelActionOf(options().cancel)?.onClick),
    close: (reason = 'dismiss') => finish(reason),
    update,
    titleId,
    descriptionId,
  }

  const record: AlertDialogRecord = {
    id,
    mode,
    render,
    options,
    open,
    pending: runner.pending,
    presentation,
    handle: {
      id,
      update,
      close: () => finish('api'),
      result: result.result,
    },
    abandon: () => {
      result.settle('api')
    },
    remove: () => undefined,
  }
  return record
}
