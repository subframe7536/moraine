import type { JSX } from 'solid-js'
import {
  DEV,
  For,
  Show,
  createEffect,
  createMemo,
  createSignal,
  createUniqueId,
  getOwner,
  on,
  onCleanup,
  runWithOwner,
  untrack,
} from 'solid-js'
import { isServer } from 'solid-js/web'

import { Button } from '../../element/button'
import { Icon } from '../../element/icon'
import { createStyles } from '../../provider'
import { useCn } from '../../provider/cn-context'
import { useMessages } from '../../provider/locale/locale-context'
import { hasJsxContent } from '../../shared/jsx-content'
import { Dialog } from '../dialog'
import { defaultDialogMessages } from '../dialog/dialog.messages'

import {
  ALERT_DIALOG_CENTER_ICON_CLASS,
  ALERT_DIALOG_ICON_TONE_CLASS,
  alertDialogRecipe,
} from './alert-dialog.recipe'
import type { AlertDialogProps, AlertDialogT } from './alert-dialog.types'

const ALERT_DIALOG_ICONS = {
  confirm: 'icon-caution',
  info: 'icon-info',
  warning: 'icon-warning',
  error: 'icon-error',
  success: 'icon-success',
} as const satisfies Record<AlertDialogT.Type, string>

const ALERT_DIALOG_CONFIG_KEYS = [
  'cancel',
  'cancelText',
  'cancelVariant',
  'class',
  'classes',
  'closeOnEscape',
  'close',
  'center',
  'danger',
  'icon',
  'closeOnOverlayClick',
  'okText',
  'okVariant',
  'style',
  'styles',
  'subtle',
  'width',
] as const satisfies readonly (keyof AlertDialogT.Config)[]

const ALERT_DIALOG_CONFIG_KEY_SET = new Set<string>(ALERT_DIALOG_CONFIG_KEYS)

type PendingKind = 'ok' | 'cancel'

interface AlertDialogEntryProps {
  accept: () => Promise<void> | void
  ariaLabel: () => string | undefined
  cancel: () => boolean | undefined
  cancelText: () => JSX.Element | undefined
  cancelVariant: () => AlertDialogT.Options['cancelVariant']
  class: () => string | undefined
  classes: () => AlertDialogT.Options['classes']
  closeOnEscape: () => boolean | undefined
  close: () => boolean | undefined
  center: () => boolean | null | undefined
  danger: () => boolean | null | undefined
  description: () => JSX.Element | undefined
  dismiss: () => Promise<void> | void
  icon: () => AlertDialogT.Options['icon']
  id: string
  closeOnOverlayClick: () => boolean | undefined
  okText: () => JSX.Element | undefined
  okVariant: () => AlertDialogT.Options['okVariant']
  open: () => boolean
  pendingKind: () => PendingKind | undefined
  remove: () => void
  style: () => JSX.CSSProperties | undefined
  styles: () => AlertDialogT.Options['styles']
  subtle: () => boolean | null | undefined
  title: () => JSX.Element | undefined
  type: AlertDialogT.Type
  width: () => string | number | undefined
}

interface AlertDialogRecord {
  entry: AlertDialogEntryProps
  id: string
  remove: () => void
  settle: (value: boolean) => void
}

interface AlertDialogController {
  destroyAll: () => void
  id: () => string | undefined
  open: (type: AlertDialogT.Type, options: AlertDialogT.Options) => AlertDialogT.Instance
}

// Client hosts only. The last mounted host receives calls that omit an id.
const hosts: AlertDialogController[] = []

function isPromiseLike(value: unknown): value is PromiseLike<unknown> {
  return (
    (typeof value === 'object' || typeof value === 'function') &&
    value !== null &&
    typeof (value as PromiseLike<unknown>).then === 'function'
  )
}

function createSettledInstance(value: boolean): AlertDialogT.Instance {
  return Object.assign(Promise.resolve(value), {
    close: () => undefined,
    destroy: () => undefined,
    update: () => undefined,
  })
}

function activeHost(id?: string): AlertDialogController | undefined {
  if (id === undefined) {
    return hosts.at(-1)
  }
  for (let index = hosts.length - 1; index >= 0; index -= 1) {
    const host = hosts[index]
    if (host?.id() === id) {
      return host
    }
  }
  return undefined
}

function missingHostMessage(id?: string): string {
  if (id === undefined) {
    return 'Mount <AlertDialog> before calling AlertDialog.'
  }
  return `Mount <AlertDialog id="${id}"> before calling AlertDialog.`
}

// Host defaults are snapshotted when a dialog opens. Later host changes do not rewrite it.
// oxlint-disable subf/solid-reactivity
function readAlertDialogConfig(props: AlertDialogProps): AlertDialogT.Config {
  return {
    cancel: props.cancel,
    cancelText: props.cancelText,
    cancelVariant: props.cancelVariant,
    class: props.class,
    classes: props.classes,
    closeOnEscape: props.closeOnEscape,
    close: props.close,
    center: props.center,
    danger: props.danger,
    icon: props.icon,
    closeOnOverlayClick: props.closeOnOverlayClick,
    okText: props.okText,
    okVariant: props.okVariant,
    style: props.style,
    styles: props.styles,
    subtle: props.subtle,
    width: props.width,
  }
}
// oxlint-enable subf/solid-reactivity

function optionValue<K extends keyof AlertDialogT.Options>(
  options: () => AlertDialogT.Options,
  config: AlertDialogT.Config,
  key: K,
): () => AlertDialogT.Options[K] {
  return () => {
    const own = options()[key]
    if (own !== undefined || !ALERT_DIALOG_CONFIG_KEY_SET.has(key)) {
      return own
    }
    const fallback = config[key as keyof AlertDialogT.Config]
    return (fallback === undefined ? own : fallback) as AlertDialogT.Options[K]
  }
}

function createAlertDialog(
  type: AlertDialogT.Type,
  options: AlertDialogT.Options,
  config: AlertDialogT.Config,
): {
  instance: AlertDialogT.Instance
  record: AlertDialogRecord
} {
  const [open, setOpen] = createSignal(true)
  const [currentOptions, setCurrentOptions] = createSignal(options)
  const [pendingKind, setPendingKind] = createSignal<PendingKind | undefined>()
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
    } catch (error) {
      console.error(error)
      return
    }
    if (!isPromiseLike(outcome)) {
      finish(confirmed)
      return
    }
    setPendingKind(confirmed ? 'ok' : 'cancel')
    const task = Promise.resolve(outcome)
      .then(() => {
        finish(confirmed)
      })
      .catch((error: unknown) => {
        console.error(error)
        throw error
      })
      .finally(() => {
        if (pending === task) {
          pending = undefined
          setPendingKind(undefined)
        }
      })
    pending = task
    return task
  }
  const update = (next: Partial<AlertDialogT.Options>): void => {
    setCurrentOptions((current) => ({ ...current, ...next }))
  }
  const id = `alert-dialog-${createUniqueId()}`
  // Accessors are stored here and read later from AlertDialogEntry.
  // oxlint-disable subf/solid-reactivity
  const record: AlertDialogRecord = {
    id,
    remove: () => undefined,
    settle,
    entry: {
      accept: () => runAction(true),
      ariaLabel: optionValue(currentOptions, config, 'ariaLabel'),
      cancel: optionValue(currentOptions, config, 'cancel'),
      cancelText: optionValue(currentOptions, config, 'cancelText'),
      cancelVariant: optionValue(currentOptions, config, 'cancelVariant'),
      class: optionValue(currentOptions, config, 'class'),
      classes: optionValue(currentOptions, config, 'classes'),
      closeOnEscape: optionValue(currentOptions, config, 'closeOnEscape'),
      close: optionValue(currentOptions, config, 'close'),
      center: optionValue(currentOptions, config, 'center'),
      danger: optionValue(currentOptions, config, 'danger'),
      description: optionValue(currentOptions, config, 'description'),
      dismiss: () => runAction(false),
      icon: optionValue(currentOptions, config, 'icon'),
      id,
      closeOnOverlayClick: optionValue(currentOptions, config, 'closeOnOverlayClick'),
      okText: optionValue(currentOptions, config, 'okText'),
      okVariant: optionValue(currentOptions, config, 'okVariant'),
      open,
      pendingKind,
      remove: () => record.remove(),
      style: optionValue(currentOptions, config, 'style'),
      styles: optionValue(currentOptions, config, 'styles'),
      subtle: optionValue(currentOptions, config, 'subtle'),
      title: optionValue(currentOptions, config, 'title'),
      type,
      width: optionValue(currentOptions, config, 'width'),
    },
  }
  // oxlint-enable subf/solid-reactivity
  const instance: AlertDialogT.Instance = Object.assign(result, {
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

function openAlertDialog(
  type: AlertDialogT.Type,
  options: AlertDialogT.Options,
  hostId?: string,
): AlertDialogT.Instance {
  if (isServer) {
    return createSettledInstance(false)
  }
  const host = activeHost(hostId)
  if (!host) {
    throw new Error(missingHostMessage(hostId))
  }
  return host.open(type, options)
}

function openAlertDialogMethod(
  type: AlertDialogT.Type,
  optionsOrId: AlertDialogT.Options | string,
  options?: AlertDialogT.Options,
): AlertDialogT.Instance {
  if (typeof optionsOrId === 'string') {
    return openAlertDialog(type, options ?? {}, optionsOrId)
  }
  return openAlertDialog(type, optionsOrId)
}

function createAlertDialogMethod(type: AlertDialogT.Type): AlertDialogT.Method {
  const method = (
    optionsOrId: AlertDialogT.Options | string,
    options?: AlertDialogT.Options,
  ): AlertDialogT.Instance => openAlertDialogMethod(type, optionsOrId, options)
  return method
}

function AlertDialogEntry(props: AlertDialogEntryProps): JSX.Element {
  const cn = useCn()
  const messages = useMessages('dialog', defaultDialogMessages)
  const title = createMemo(() => props.title())
  const description = createMemo(() => props.description())
  const icon = createMemo(() => {
    const configured = props.icon()
    if (configured === null) {
      return undefined
    }
    if (configured !== undefined) {
      return configured
    }
    if (props.type === 'confirm') {
      return props.danger() ? ALERT_DIALOG_ICONS.confirm : undefined
    }
    return ALERT_DIALOG_ICONS[props.type]
  })
  const showHeader = () =>
    hasJsxContent(icon()) || hasJsxContent(title()) || hasJsxContent(description())
  const showCancel = () => props.cancel() ?? props.type === 'confirm'
  const contentStyle = (): JSX.CSSProperties => {
    const width = props.width()
    const style = props.style()
    if (width === undefined) {
      return style ?? {}
    }
    return {
      'max-width': typeof width === 'number' ? `${width}px` : width,
      ...style,
    }
  }
  const resolved = createStyles(
    alertDialogRecipe,
    {
      get center() {
        return props.center()
      },
      get danger() {
        return props.danger()
      },
      get subtle() {
        return props.subtle()
      },
      get class() {
        return props.class()
      },
      get classes() {
        return props.classes()
      },
      get style() {
        return contentStyle()
      },
      get styles() {
        return props.styles()
      },
    },
    { rootSlot: 'content' },
  )
  const okVariant = (): NonNullable<AlertDialogT.Options['okVariant']> =>
    props.okVariant() ?? (resolved.variants.danger ? 'danger' : 'default')
  const iconTone = () => {
    if (props.icon() !== undefined) {
      return undefined
    }
    if (props.type === 'confirm') {
      return resolved.variants.danger ? ALERT_DIALOG_ICON_TONE_CLASS.confirm : undefined
    }
    return ALERT_DIALOG_ICON_TONE_CLASS[props.type]
  }
  const pending = () => props.pendingKind() !== undefined

  createEffect(
    on([title, () => props.ariaLabel()], ([currentTitle, currentLabel]) => {
      if (!DEV || hasJsxContent(currentTitle) || currentLabel) {
        return
      }
      console.warn('[moraine] AlertDialog has no accessible name. Pass title or ariaLabel.')
    }),
  )

  return (
    <Dialog
      id={props.id}
      open={props.open()}
      modal
      close={(props.close() ?? false) && !pending()}
      closeOnOverlayClick={props.closeOnOverlayClick() === true}
      closeOnEscape={props.closeOnEscape() !== false && !pending()}
      ariaLabel={hasJsxContent(title()) ? undefined : props.ariaLabel()}
      onOpenChange={(next) => {
        if (!next) {
          void props.dismiss()
        }
      }}
      onExitComplete={() => props.remove()}
    >
      <Dialog.Content
        role="alertdialog"
        class={resolved.styles.content.class}
        style={resolved.styles.content.style}
      >
        <Show when={showHeader()}>
          <Dialog.Header class={resolved.styles.header.class}>
            <Show when={icon()}>
              {(current) => (
                <Show
                  when={resolved.variants.center}
                  fallback={
                    <Icon name={current()} class={cn(resolved.styles.icon.class, iconTone())} />
                  }
                >
                  <div class={ALERT_DIALOG_CENTER_ICON_CLASS}>
                    <Icon name={current()} class={cn(resolved.styles.icon.class, iconTone())} />
                  </div>
                </Show>
              )}
            </Show>
            <div class={resolved.styles.copy.class}>
              <Show when={hasJsxContent(title())}>
                <Dialog.Title>{title()}</Dialog.Title>
              </Show>
              <Show when={hasJsxContent(description())}>
                <Dialog.Description>{description()}</Dialog.Description>
              </Show>
            </div>
          </Dialog.Header>
        </Show>
        <Dialog.Footer class={resolved.styles.footer.class}>
          <Show when={showCancel()}>
            <Button
              variant={props.cancelVariant() ?? 'outline'}
              class={resolved.styles.action.class}
              disabled={props.pendingKind() === 'ok'}
              loadingAuto
              onClick={() => props.dismiss()}
            >
              {props.cancelText() ?? messages().cancel}
            </Button>
          </Show>
          <Button
            variant={okVariant()}
            class={resolved.styles.action.class}
            disabled={props.pendingKind() === 'cancel'}
            loadingAuto
            onClick={() => props.accept()}
          >
            {props.okText() ?? messages().ok}
          </Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>
  )
}

/** Mount once under `MoraineProvider`. Its props are the defaults for every alert dialog. */
export function AlertDialog(props: AlertDialogProps): JSX.Element {
  const owner = getOwner()
  const [dialogs, setDialogs] = createSignal<AlertDialogRecord[]>([])
  const removeDialog = (id: string): void => {
    setDialogs((current) => current.filter((item) => item.id !== id))
  }
  const controller: AlertDialogController = {
    id: () => props.id,
    open(type, options) {
      return runWithOwner(owner, () => {
        const created = createAlertDialog(
          type,
          options,
          untrack(() => readAlertDialogConfig(props)),
        )
        created.record.remove = () => removeDialog(created.record.id)
        setDialogs((current) => [...current, created.record])
        return created.instance
      })!
    },
    destroyAll() {
      for (const item of dialogs()) {
        item.settle(false)
      }
      setDialogs([])
    },
  }
  if (!isServer) {
    hosts.push(controller)
  }
  if (DEV) {
    createEffect(
      on(
        () => props.id,
        (id) => {
          if (!id) {
            return
          }
          const duplicate = hosts.some((host) => host !== controller && host.id() === id)
          if (duplicate) {
            console.warn(
              `[moraine] Duplicate AlertDialog host id "${id}". Later host will take precedence.`,
            )
          }
        },
      ),
    )
  }
  onCleanup(() => {
    if (isServer) {
      return
    }
    const index = hosts.lastIndexOf(controller)
    if (index !== -1) {
      hosts.splice(index, 1)
    }
    for (const item of dialogs()) {
      item.settle(false)
    }
  })

  return <For each={dialogs()}>{(item) => <AlertDialogEntry {...item.entry} />}</For>
}

AlertDialog.confirm = createAlertDialogMethod('confirm')
AlertDialog.info = createAlertDialogMethod('info')
AlertDialog.warning = createAlertDialogMethod('warning')
AlertDialog.error = createAlertDialogMethod('error')
AlertDialog.success = createAlertDialogMethod('success')
AlertDialog.destroyAll = (id?: string): void => {
  if (isServer) {
    return
  }
  const host = activeHost(id)
  if (!host) {
    if (id !== undefined) {
      throw new Error(missingHostMessage(id))
    }
    return
  }
  host.destroyAll()
}
