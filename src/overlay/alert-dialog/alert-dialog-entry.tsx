import type { JSX } from 'solid-js'
import { DEV, Show, createEffect, createMemo, on } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { Icon } from '../../element/icon'
import { createStyles } from '../../provider'
import { useMessages } from '../../provider/locale/locale-context'
import { hasJsxContent } from '../../shared/jsx-content'
import { useRegisteredContentId } from '../base/content-anatomy'
import { FeedbackActionButton } from '../base/feedback/feedback-action'
import { resolveFeedbackIcon } from '../base/feedback/feedback-icons'
import { Dialog } from '../dialog'
import { useDialogContent } from '../dialog/dialog-context'
import { defaultDialogMessages } from '../dialog/dialog.messages'

import type { AlertDialogRecord } from './alert-dialog-record'
import {
  ALERT_DIALOG_CENTER_ICON_CLASS,
  ALERT_DIALOG_ICON_TONE_CLASS,
  alertDialogRecipe,
} from './alert-dialog.recipe'
import type { AlertDialogT } from './alert-dialog.types'

function contentMaxWidth(width: string | number | undefined): string | undefined {
  if (width === undefined) {
    return undefined
  }
  return typeof width === 'number' ? `${width}px` : width
}

function showsCancel(
  mode: AlertDialogRecord['mode'],
  cancel: AlertDialogT.Options['cancel'],
): boolean {
  if (cancel === undefined) {
    return mode === 'confirm'
  }
  return cancel !== false
}

function RegisterCustomLabels(props: {
  record: AlertDialogRecord
  titleId: string
  descriptionId: string
}): JSX.Element {
  const content = useDialogContent()
  useRegisteredContentId(() => props.titleId, content.registerTitle)
  useRegisteredContentId(() => props.descriptionId, content.registerDescription)
  createEffect(
    on(
      () => [props.record.options().title, props.record.options().ariaLabel] as const,
      ([title, label]) => {
        if (!DEV || hasJsxContent(title) || label) {
          return
        }
        console.warn('[moraine] AlertDialog has no accessible name. Pass title or ariaLabel.')
      },
    ),
  )
  return <></>
}

function AlertDialogDefault(props: { record: AlertDialogRecord }): JSX.Element {
  const messages = useMessages('dialog', defaultDialogMessages)
  const options = () => props.record.options()
  const title = createMemo(() => options().title)
  const description = createMemo(() => options().description)
  const icon = createMemo(() =>
    resolveFeedbackIcon({
      type: options().type,
      icon: options().icon,
      danger: options().danger,
    }),
  )
  const iconToneClass = (): string | undefined => {
    if (options().icon !== undefined) {
      return undefined
    }
    const type = options().type
    if (type === undefined || type === 'default') {
      return options().danger ? ALERT_DIALOG_ICON_TONE_CLASS.confirm : undefined
    }
    return ALERT_DIALOG_ICON_TONE_CLASS[type]
  }
  const resolved = createStyles(
    alertDialogRecipe,
    {
      get center() {
        return options().center
      },
      get danger() {
        return options().danger
      },
      get subtle() {
        return options().subtle
      },
      get class() {
        return options().class
      },
      get classes() {
        return options().classes
      },
      get style() {
        return options().style
      },
      get styles() {
        return options().styles
      },
    },
    {
      slot: 'content',
      own: () => {
        const tone = iconToneClass()
        return tone === undefined ? undefined : { icon: { class: tone } }
      },
    },
  )
  const cancelConfig = () => {
    const cancel = options().cancel
    return cancel && typeof cancel !== 'boolean' ? cancel : undefined
  }
  const showHeader = () =>
    hasJsxContent(icon()) || hasJsxContent(title()) || hasJsxContent(description())

  createEffect(
    on(
      () => [title(), options().ariaLabel] as const,
      ([currentTitle, label]) => {
        if (!DEV || hasJsxContent(currentTitle) || label) {
          return
        }
        console.warn('[moraine] AlertDialog has no accessible name. Pass title or ariaLabel.')
      },
    ),
  )

  return (
    <>
      <Show when={showHeader()}>
        <Dialog.Header class={resolved.slots.header.class} style={resolved.slots.header.style}>
          <Show when={icon()}>
            {(current) => (
              <Show
                when={resolved.variants.center}
                fallback={
                  <Icon
                    name={current()}
                    class={resolved.slots.icon.class}
                    style={resolved.slots.icon.style}
                  />
                }
              >
                <div class={ALERT_DIALOG_CENTER_ICON_CLASS}>
                  <Icon
                    name={current()}
                    class={resolved.slots.icon.class}
                    style={resolved.slots.icon.style}
                  />
                </div>
              </Show>
            )}
          </Show>
          <div
            data-slot="alert-dialog-copy"
            class={resolved.slots.copy.class}
            style={resolved.slots.copy.style}
          >
            <Show when={hasJsxContent(title())}>
              <Dialog.Title>{title()}</Dialog.Title>
            </Show>
            <Show when={hasJsxContent(description())}>
              <Dialog.Description>{description()}</Dialog.Description>
            </Show>
          </div>
        </Dialog.Header>
      </Show>
      <Dialog.Footer class={resolved.slots.footer.class} style={resolved.slots.footer.style}>
        <Show when={showsCancel(props.record.mode, options().cancel)}>
          <FeedbackActionButton
            action={cancelConfig()}
            label={messages().cancel}
            variant="outline"
            loading={props.record.pending() === 'cancel'}
            disabled={props.record.pending() === 'action'}
            slotName="alert-dialog-action"
            {...resolved.slotWith('action', () => ({
              class: cancelConfig()?.class,
              style: cancelConfig()?.style,
            }))}
            onClick={(event) => props.record.presentation.cancel(event)}
          />
        </Show>
        <FeedbackActionButton
          action={options().action}
          label={messages().ok}
          variant={options().danger ? 'danger' : 'default'}
          loading={props.record.pending() === 'action'}
          disabled={props.record.pending() === 'cancel'}
          slotName="alert-dialog-action"
          {...resolved.slotWith('action', () => ({
            class: options().action?.class,
            style: options().action?.style,
          }))}
          onClick={(event) => props.record.presentation.action(event)}
        />
      </Dialog.Footer>
    </>
  )
}

export function AlertDialogEntry(props: {
  record: AlertDialogRecord
  dialogRender: () => AlertDialogT.Render | undefined
}): JSX.Element {
  const options = () => props.record.options()
  const customRender = () => props.record.render ?? props.dialogRender()
  const maxWidth = () => contentMaxWidth(options().width)
  const resolved = createStyles(
    alertDialogRecipe,
    {
      get center() {
        return options().center
      },
      get danger() {
        return options().danger
      },
      get subtle() {
        return options().subtle
      },
      get class() {
        return options().class
      },
      get classes() {
        return options().classes
      },
      get style() {
        return options().style
      },
      get styles() {
        return options().styles
      },
    },
    {
      slot: 'content',
      own: () => ({
        content: maxWidth() !== undefined ? { style: { 'max-width': maxWidth() } } : undefined,
      }),
    },
  )

  return (
    <Dialog
      id={String(props.record.id)}
      open={props.record.open()}
      modal
      close={(options().close ?? false) && props.record.pending() === undefined}
      closeOnOverlayClick={
        options().closeOnOverlayClick === true && props.record.pending() === undefined
      }
      closeOnEscape={options().closeOnEscape !== false && props.record.pending() === undefined}
      ariaLabel={
        customRender() || !hasJsxContent(options().title) ? options().ariaLabel : undefined
      }
      onOpenChange={(next) => {
        if (!next && props.record.pending() === undefined) {
          props.record.presentation.close('dismiss')
        }
      }}
      onExitComplete={() => props.record.remove()}
    >
      <Dialog.Content
        role="alertdialog"
        class={resolved.slots.content.class}
        style={resolved.slots.content.style}
      >
        <Show when={customRender()} keyed fallback={<AlertDialogDefault record={props.record} />}>
          {(render) => (
            <>
              <RegisterCustomLabels
                record={props.record}
                titleId={props.record.presentation.titleId}
                descriptionId={props.record.presentation.descriptionId}
              />
              <Dynamic
                component={render}
                id={props.record.presentation.id}
                options={props.record.presentation.options}
                pending={props.record.presentation.pending}
                action={props.record.presentation.action}
                cancel={props.record.presentation.cancel}
                close={props.record.presentation.close}
                update={props.record.presentation.update}
                titleId={props.record.presentation.titleId}
                descriptionId={props.record.presentation.descriptionId}
              />
            </>
          )}
        </Show>
      </Dialog.Content>
    </Dialog>
  )
}
