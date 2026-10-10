import type { Accessor, JSX } from 'solid-js'
import { For, Show, createMemo } from 'solid-js'

import { Button } from '../../element/button'
import type { ButtonT } from '../../element/button'
import { Icon } from '../../element/icon'
import { useCn } from '../../provider/cn-context'
import { useMessages } from '../../provider/locale/locale-context'
import { hasJsxContent } from '../../shared/jsx-content'

import { Dialog } from './dialog'
import { defaultDialogMessages } from './dialog.messages'
import {
  ALERT_DIALOG_COPY_CLASS,
  ALERT_DIALOG_HEADER_CLASS,
  ALERT_DIALOG_ICON_CLASS,
  ALERT_DIALOG_ICON_TONE_CLASS,
} from './dialog.recipe'
import type { AlertDialogRecord, AlertDialogType } from './use-alert-dialog'

const ALERT_DIALOG_ICONS = {
  confirm: 'icon-caution',
  info: 'icon-info',
  warning: 'icon-warning',
  error: 'icon-error',
  success: 'icon-success',
} as const satisfies Record<AlertDialogType, string>

function AlertDialogEntry(props: { item: AlertDialogRecord }): JSX.Element {
  const cn = useCn()
  const messages = useMessages('dialog', defaultDialogMessages)
  const options = () => props.item.options()
  const title = createMemo(() => options().title)
  const description = createMemo(() => options().description)
  const content = createMemo(() => options().content)
  const icon = createMemo(() => {
    const configured = options().icon
    if (configured === null) {
      return undefined
    }
    return configured ?? ALERT_DIALOG_ICONS[props.item.type]
  })
  const showHeader = () =>
    hasJsxContent(icon()) || hasJsxContent(title()) || hasJsxContent(description())
  const showCancel = () => options().cancel ?? props.item.type === 'confirm'
  const contentStyle = (): JSX.CSSProperties => {
    const current = options()
    const width = current.width
    if (width === undefined) {
      return current.style ?? {}
    }
    return {
      'max-width': typeof width === 'number' ? `${width}px` : width,
      ...current.style,
    }
  }
  const okVariant = (): NonNullable<ButtonT.Variant['variant']> => {
    const current = options()
    return current.okVariant ?? (current.danger ? 'destructive' : 'default')
  }

  return (
    <Dialog
      id={props.item.id}
      open={props.item.open()}
      modal
      close={options().closable ?? false}
      disablePointerDismissal={options().maskClosable !== true}
      closeOnEscape={options().closeOnEscape !== false}
      classes={options().classes}
      styles={options().styles}
      ariaLabel={hasJsxContent(title()) ? undefined : options().ariaLabel}
      onOpenChange={(next) => {
        if (!next) {
          void props.item.dismiss()
        }
      }}
      onExitComplete={() => props.item.remove()}
    >
      <Dialog.Content role="alertdialog" class={options().class} style={contentStyle()}>
        <Show when={showHeader()}>
          <Dialog.Header>
            <div class={ALERT_DIALOG_HEADER_CLASS}>
              <Show when={icon()}>
                {(current) => (
                  <Icon
                    name={current()}
                    class={cn(
                      ALERT_DIALOG_ICON_CLASS,
                      ALERT_DIALOG_ICON_TONE_CLASS[props.item.type],
                    )}
                  />
                )}
              </Show>
              <div class={ALERT_DIALOG_COPY_CLASS}>
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
        <Show when={hasJsxContent(content())}>
          <Dialog.Body>{content()}</Dialog.Body>
        </Show>
        <Dialog.Footer>
          <Show when={showCancel()}>
            <Button
              variant={options().cancelVariant ?? 'outline'}
              loadingAuto
              onClick={() => props.item.dismiss()}
            >
              {options().cancelText ?? messages().cancel}
            </Button>
          </Show>
          <Button variant={okVariant()} loadingAuto onClick={() => props.item.accept()}>
            {options().okText ?? messages().ok}
          </Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>
  )
}

export function AlertDialogView(props: { dialogs: Accessor<AlertDialogRecord[]> }): JSX.Element {
  return <For each={props.dialogs()}>{(item) => <AlertDialogEntry item={item} />}</For>
}
