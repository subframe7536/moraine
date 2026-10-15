import type { JSX } from 'solid-js'
import { For, createSignal, getOwner, onCleanup, runWithOwner } from 'solid-js'
import { isServer } from 'solid-js/web'

import { inertFeedbackHandle } from '../base/feedback/handle'
import { createHostRegistry } from '../base/feedback/host-registry'
import type { FeedbackHost } from '../base/feedback/host-registry'

import { AlertDialogEntry } from './alert-dialog-entry'
import { createAlertDialogRecord } from './alert-dialog-record'
import type { AlertDialogHostDefaults, AlertDialogRecord } from './alert-dialog-record'
import type { AlertDialogProps, AlertDialogT } from './alert-dialog.types'

interface AlertDialogController extends FeedbackHost {
  defaults: () => AlertDialogHostDefaults
  dialogRender: () => AlertDialogT.Render | undefined
  open: (
    mode: 'confirm' | 'standard',
    options: AlertDialogT.Options,
    render?: AlertDialogT.Render,
  ) => AlertDialogT.Handle
  update: (id: AlertDialogT.Id, options: AlertDialogT.UpdateOptions) => boolean
  close: (id?: AlertDialogT.Id) => void
}

const registry = createHostRegistry<AlertDialogController>('AlertDialog')

/* oxlint-disable subf/solid-reactivity -- Host defaults are read when a dialog renders so later prop changes stay live. */
function readHostDefaults(props: AlertDialogProps): AlertDialogHostDefaults {
  return {
    close: props.close,
    closeOnEscape: props.closeOnEscape,
    closeOnOverlayClick: props.closeOnOverlayClick,
    center: props.center,
    subtle: props.subtle,
    danger: props.danger,
    type: props.type ?? undefined,
    width: props.width,
    classes: props.classes,
    styles: props.styles,
  }
}
/* oxlint-enable subf/solid-reactivity */

function openAlertDialog(
  mode: 'confirm' | 'standard',
  options: AlertDialogT.Options,
  render?: AlertDialogT.Render,
): AlertDialogT.Handle {
  if (isServer) {
    return inertFeedbackHandle(options.id)
  }
  const host = registry.require(options.host)
  return host.open(mode, options, render)
}

function withType(type: AlertDialogT.Type, options: AlertDialogT.Options): AlertDialogT.Options {
  return { ...options, type }
}

/** Mount once under `MoraineProvider`. Its props are the defaults for every alert dialog. */
export function AlertDialog(props: AlertDialogProps): JSX.Element {
  const owner = getOwner()
  const [dialogs, setDialogs] = createSignal<AlertDialogRecord[]>([])
  const removeDialog = (record: AlertDialogRecord): void => {
    setDialogs((current) => current.filter((item) => item !== record))
  }
  const findOpen = (id: AlertDialogT.Id): AlertDialogRecord | undefined =>
    dialogs().find((item) => item.id === id && item.open())
  const controller: AlertDialogController = {
    id: () => props.id,
    defaults: () => readHostDefaults(props),
    dialogRender: () => props.dialogRender,
    open(mode, options, render) {
      if (options.id !== undefined) {
        const existing = findOpen(options.id)
        if (existing && existing.mode === mode && existing.render === render) {
          existing.handle.update(options)
          return existing.handle
        }
        // A different method or render cannot be applied in place, so replace the dialog.
        existing?.handle.close()
      }
      return runWithOwner(owner, () => {
        const created = createAlertDialogRecord(mode, options, () => controller.defaults(), render)
        created.remove = () => removeDialog(created)
        setDialogs((current) => [...current, created])
        return created.handle
      })!
    },
    update(id, options) {
      const match = findOpen(id)
      if (!match) {
        return false
      }
      match.handle.update(options)
      return true
    },
    close(id) {
      for (const item of dialogs()) {
        if (item.open() && (id === undefined || item.id === id)) {
          item.handle.close()
        }
      }
    },
  }
  const unregister = registry.register(controller)
  onCleanup(() => {
    unregister()
    for (const item of dialogs()) {
      item.abandon()
    }
  })

  return (
    <For each={dialogs()}>
      {(item) => <AlertDialogEntry record={item} dialogRender={controller.dialogRender} />}
    </For>
  )
}

AlertDialog.show = (options: AlertDialogT.Options): AlertDialogT.Handle =>
  openAlertDialog('standard', options)
AlertDialog.confirm = (options: AlertDialogT.Options): AlertDialogT.Handle =>
  openAlertDialog('confirm', options)
AlertDialog.info = (options: AlertDialogT.Options): AlertDialogT.Handle =>
  openAlertDialog('standard', withType('info', options))
AlertDialog.success = (options: AlertDialogT.Options): AlertDialogT.Handle =>
  openAlertDialog('standard', withType('success', options))
AlertDialog.warning = (options: AlertDialogT.Options): AlertDialogT.Handle =>
  openAlertDialog('standard', withType('warning', options))
AlertDialog.error = (options: AlertDialogT.Options): AlertDialogT.Handle =>
  openAlertDialog('standard', withType('error', options))
AlertDialog.custom = (
  render: AlertDialogT.Render,
  options?: AlertDialogT.Options,
): AlertDialogT.Handle => openAlertDialog('standard', options ?? {}, render)
AlertDialog.update = (id: AlertDialogT.Id, options: AlertDialogT.UpdateOptions): void => {
  if (isServer) {
    return
  }
  for (const host of registry.entries()) {
    if (host.update(id, options)) {
      return
    }
  }
}
AlertDialog.close = (target?: AlertDialogT.Id | AlertDialogT.CloseTarget): void => {
  if (isServer) {
    return
  }
  const scope = typeof target === 'object' && target !== null ? target : { id: target }
  for (const host of registry.entries()) {
    if (scope.host === undefined || host.id() === scope.host) {
      host.close(scope.id)
    }
  }
}
