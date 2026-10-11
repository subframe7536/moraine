import type { JSX } from 'solid-js'
import { For, Show, createMemo, createSignal, createUniqueId, onCleanup, untrack } from 'solid-js'

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
  'closable',
  'center',
  'danger',
  'icon',
  'overlayDismissable',
  'okText',
  'okVariant',
  'style',
  'styles',
  'subtle',
  'width',
] as const satisfies readonly (keyof AlertDialogT.Config)[]

const ALERT_DIALOG_CONFIG_KEY_SET = new Set<string>(ALERT_DIALOG_CONFIG_KEYS)

interface AlertDialogEntryProps {
  accept: () => Promise<void> | void
  ariaLabel: () => string | undefined
  cancel: () => boolean | undefined
  cancelText: () => JSX.Element | undefined
  cancelVariant: () => AlertDialogT.Options['cancelVariant']
  class: () => string | undefined
  classes: () => AlertDialogT.Options['classes']
  closeOnEscape: () => boolean | undefined
  closable: () => boolean | undefined
  center: () => boolean | null | undefined
  danger: () => boolean | null | undefined
  description: () => JSX.Element | undefined
  dismiss: () => Promise<void> | void
  icon: () => AlertDialogT.Options['icon']
  id: string
  overlayDismissable: () => boolean | undefined
  okText: () => JSX.Element | undefined
  okVariant: () => AlertDialogT.Options['okVariant']
  open: () => boolean
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
  open: (type: AlertDialogT.Type, options: AlertDialogT.Options) => AlertDialogT.Instance
}

// The last mounted host receives calls.
const providers: AlertDialogController[] = []

function isPromiseLike(value: unknown): value is PromiseLike<unknown> {
  return (
    (typeof value === 'object' || typeof value === 'function') &&
    value !== null &&
    typeof (value as PromiseLike<unknown>).then === 'function'
  )
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
    closable: props.closable,
    center: props.center,
    danger: props.danger,
    icon: props.icon,
    overlayDismissable: props.overlayDismissable,
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
      closable: optionValue(currentOptions, config, 'closable'),
      center: optionValue(currentOptions, config, 'center'),
      danger: optionValue(currentOptions, config, 'danger'),
      description: optionValue(currentOptions, config, 'description'),
      dismiss: () => runAction(false),
      icon: optionValue(currentOptions, config, 'icon'),
      id,
      overlayDismissable: optionValue(currentOptions, config, 'overlayDismissable'),
      okText: optionValue(currentOptions, config, 'okText'),
      okVariant: optionValue(currentOptions, config, 'okVariant'),
      open,
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
): AlertDialogT.Instance {
  const provider = providers.at(-1)
  if (!provider) {
    throw new Error('Mount <AlertDialog> before calling AlertDialog.')
  }
  return provider.open(type, options)
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
    props.okVariant() ?? (resolved.variants.danger ? 'destructive' : 'default')

  return (
    <Dialog
      id={props.id}
      open={props.open()}
      modal
      close={props.closable() ?? false}
      disablePointerDismissal={props.overlayDismissable() !== true}
      closeOnEscape={props.closeOnEscape() !== false}
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
          <Dialog.Header>
            <div class={resolved.styles.header.class}>
              <Show when={icon()}>
                {(current) => (
                  <Show
                    when={resolved.variants.center}
                    fallback={
                      <Icon
                        name={current()}
                        class={cn(
                          resolved.styles.icon.class,
                          ALERT_DIALOG_ICON_TONE_CLASS[props.type],
                        )}
                      />
                    }
                  >
                    <div class={ALERT_DIALOG_CENTER_ICON_CLASS}>
                      <Icon name={current()} class={resolved.styles.icon.class} />
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
            </div>
          </Dialog.Header>
        </Show>
        <Dialog.Footer class={resolved.styles.footer.class}>
          <Show when={showCancel()}>
            <Button
              variant={props.cancelVariant() ?? 'outline'}
              class={resolved.styles.action.class}
              loadingAuto
              onClick={() => props.dismiss()}
            >
              {props.cancelText() ?? messages().cancel}
            </Button>
          </Show>
          <Button
            variant={okVariant()}
            class={resolved.styles.action.class}
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
  const [dialogs, setDialogs] = createSignal<AlertDialogRecord[]>([])
  const removeDialog = (id: string): void => {
    setDialogs((current) => current.filter((item) => item.id !== id))
  }
  const controller: AlertDialogController = {
    open(type, options) {
      const created = createAlertDialog(
        type,
        options,
        untrack(() => readAlertDialogConfig(props)),
      )
      created.record.remove = () => removeDialog(created.record.id)
      setDialogs((current) => [...current, created.record])
      return created.instance
    },
    destroyAll() {
      for (const item of dialogs()) {
        item.settle(false)
      }
      setDialogs([])
    },
  }
  providers.push(controller)
  onCleanup(() => {
    const index = providers.lastIndexOf(controller)
    if (index !== -1) {
      providers.splice(index, 1)
    }
    for (const item of dialogs()) {
      item.settle(false)
    }
  })

  return <For each={dialogs()}>{(item) => <AlertDialogEntry {...item.entry} />}</For>
}

AlertDialog.confirm = (options: AlertDialogT.Options): AlertDialogT.Instance =>
  openAlertDialog('confirm', options)
AlertDialog.info = (options: AlertDialogT.Options): AlertDialogT.Instance =>
  openAlertDialog('info', options)
AlertDialog.warning = (options: AlertDialogT.Options): AlertDialogT.Instance =>
  openAlertDialog('warning', options)
AlertDialog.error = (options: AlertDialogT.Options): AlertDialogT.Instance =>
  openAlertDialog('error', options)
AlertDialog.success = (options: AlertDialogT.Options): AlertDialogT.Instance =>
  openAlertDialog('success', options)
AlertDialog.destroyAll = (): void => {
  providers.at(-1)?.destroyAll()
}
