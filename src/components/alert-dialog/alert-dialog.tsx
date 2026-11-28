import type { JSX } from '@solidjs/web'
import { isServer } from '@solidjs/web'
import type { Component } from 'solid-js'
import {
  For,
  createEffect,
  createRoot,
  createSignal,
  getOwner,
  runWithOwner,
  flush,
} from 'solid-js'

import { inertFeedbackHandle } from '../shared/overlay/feedback/handle'
import { createHostRegistry } from '../shared/overlay/feedback/host-registry'
import type { FeedbackHost } from '../shared/overlay/feedback/host-registry'

import { AlertDialogEntry } from './alert-dialog-entry'
import { createAlertDialogRecord } from './alert-dialog-record'
import type { AlertDialogHostDefaults, AlertDialogRecord } from './alert-dialog-record'
import type { AlertDialogProps, AlertDialogT } from './alert-dialog.types'
interface AlertDialogController extends FeedbackHost {
  defaults: () => AlertDialogHostDefaults
  dialogRender: () => Component<AlertDialogT.DialogRenderProps> | undefined
  open: (
    mode: 'confirm' | 'standard',
    options: AlertDialogT.Options,
    render?: JSX.Element | Component<AlertDialogT.DialogRenderProps>,
  ) => AlertDialogT.Handle
  update: (id: AlertDialogT.Id, options: AlertDialogT.UpdateOptions) => boolean
  close: (id?: AlertDialogT.Id) => void
}

const registry = createHostRegistry<AlertDialogController>('AlertDialog')

function openAlertDialog(
  mode: 'confirm' | 'standard',
  options: AlertDialogT.Options,
  render?: JSX.Element | Component<AlertDialogT.DialogRenderProps>,
): AlertDialogT.Handle {
  if (isServer) {
    return inertFeedbackHandle(options.id)
  }
  const host = registry.require(options.hostId)
  return host.open(mode, options, render)
}

function withType(type: AlertDialogT.Type, options: AlertDialogT.Options): AlertDialogT.Options {
  return { ...options, type }
}

/**
 * Host for imperative confirm, info, warning, error, and success prompts, not a composable dialog:
 * it has no trigger or content parts. Mount it once under `MoraineProvider`: it renders no DOM of its own, and its props are the defaults for every dialog
 * opened with `AlertDialog.confirm(...)`, `AlertDialog.show(...)`, and the other static methods.
 * Use `Dialog` instead when the task has its own trigger, body, and footer. Calling a method
 * before a host is mounted throws.
 *
 * @example
 * ```tsx
 * import { AlertDialog, Button } from 'moraine'
 *
 * <>
 *   <AlertDialog maxWidth={420} />
 *   <Button
 *     onClick={async () => {
 *       const handle = AlertDialog.confirm({
 *         type: 'error',
 *         title: 'Delete this project?',
 *         description: 'This action cannot be undone.',
 *       })
 *       if ((await handle.result()) === 'action') {
 *         console.log('deleted')
 *       }
 *     }}
 *   >
 *     Delete
 *   </Button>
 * </>
 * ```
 */
export function AlertDialog(props: AlertDialogProps): JSX.Element {
  const owner = getOwner()
  const [dialogs, setDialogs] = createSignal<Array<AlertDialogRecord>>([])
  const removeDialog = (record: AlertDialogRecord): void => {
    setDialogs((current) => current.filter((item) => item !== record))
  }
  const findOpen = (id: AlertDialogT.Id): AlertDialogRecord | undefined =>
    dialogs().find((item) => item.id === id && item.open())
  const controller: AlertDialogController = {
    id: () => props.id,
    defaults: () => ({
      closable: props.closable,
      transition: props.transition,
      closeOnEscape: props.closeOnEscape,
      closeOnOutsideClick: props.closeOnOutsideClick,
      align: props.align,
      variant: props.variant,
      type: props.type ?? undefined,
      maxWidth: props.maxWidth,
      classes: props.classes,
      styles: props.styles,
      translations: props.translations,
    }),
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
      let disposeRecord: VoidFunction | undefined
      const created = runWithOwner(owner, () =>
        createRoot((dispose) => {
          disposeRecord = dispose
          return createAlertDialogRecord(mode, options, () => controller.defaults(), render)
        }),
      )
      created.remove = () => {
        removeDialog(created)
        disposeRecord?.()
      }
      // The caller's owner may already be disposed; write the host-owned list unowned.
      runWithOwner(null, () => flush(() => setDialogs((current) => [...current, created])))
      return created.handle
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
  createEffect(
    () => props.id,
    () => {
      const unregister = registry.register(controller)
      return () => {
        unregister()
        for (const item of dialogs()) {
          item.abandon()
        }
      }
    },
  )

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
AlertDialog.custom = ((
  render: Component<AlertDialogT.DialogRenderProps> | JSX.Element,
  options?: AlertDialogT.CustomOptions,
): AlertDialogT.Handle =>
  openAlertDialog('standard', { title: undefined, ...options }, render)) as {
  (
    render: Component<AlertDialogT.DialogRenderProps>,
    options?: AlertDialogT.CustomOptions,
  ): AlertDialogT.Handle
  (render: JSX.Element, options?: AlertDialogT.CustomOptions): AlertDialogT.Handle
}
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
    if (scope.hostId === undefined || host.id() === scope.hostId) {
      host.close(scope.id)
    }
  }
}
