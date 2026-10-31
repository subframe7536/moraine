import type { Component, JSX } from 'solid-js'
import { DEV, Show, createEffect, createMemo, on } from 'solid-js'

import { useRecipe } from '../../provider'
import { useMessages } from '../../provider/locale/locale-context'
import { hasContent } from '../../shared/jsx-content'
import { renderWithProps } from '../../shared/render-with-props'
import { Dialog } from '../dialog'
import { useDialogContent } from '../dialog/dialog-context'
import { defaultDialogMessages } from '../dialog/dialog.messages'
import { Icon } from '../icon'
import { useRegisteredContentId } from '../shared/overlay/content-anatomy'
import { FeedbackActionButton } from '../shared/overlay/feedback/feedback-action'
import { resolveFeedbackIcon } from '../shared/overlay/feedback/feedback-icons'

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

type AlertDialogRecipe = ReturnType<typeof createAlertDialogRecipe>

function iconToneClass(options: AlertDialogT.Options): string | undefined {
  if (options.icon !== undefined) {
    return undefined
  }
  const type = options.type
  if (type === undefined || type === 'default') {
    return options.danger ? ALERT_DIALOG_ICON_TONE_CLASS.confirm : undefined
  }
  return ALERT_DIALOG_ICON_TONE_CLASS[type]
}

function createAlertDialogRecipe(options: () => AlertDialogT.Options) {
  const maxWidth = () => contentMaxWidth(options().width)
  return useRecipe(
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
      own: {
        content: () => {
          const width = maxWidth()
          return width === undefined ? undefined : { style: { 'max-width': width } }
        },
        icon: () => {
          const tone = iconToneClass(options())
          return tone === undefined ? undefined : { class: tone }
        },
      },
    },
  )
}

function AlertDialogDefault(props: {
  record: AlertDialogRecord
  recipe: AlertDialogRecipe
}): JSX.Element {
  // oxlint-disable-next-line subf/solid-reactivity -- AlertDialogEntry creates the recipe once and never replaces it.
  const recipe = props.recipe
  const {
    slots: { header: headerSlot, icon: iconSlot, copy: copySlot, footer: footerSlot },
    slotWith,
    variants,
  } = recipe
  const options = () => props.record.options()
  const messages = useMessages('dialog', defaultDialogMessages, () => options().translations)
  const title = createMemo(() => options().title)
  const description = createMemo(() => options().description)
  const icon = createMemo(() =>
    resolveFeedbackIcon({
      type: options().type,
      icon: options().icon,
      danger: options().danger,
    }),
  )
  const cancelConfig = () => {
    const cancel = options().cancel
    return cancel && typeof cancel !== 'boolean' ? cancel : undefined
  }
  const cancelSlot = slotWith('cancel', {
    own: () => ({
      class: cancelConfig()?.class,
      style: cancelConfig()?.style,
    }),
  })
  const actionSlot = slotWith('action', {
    own: () => ({
      class: options().action?.class,
      style: options().action?.style,
    }),
  })
  const showHeader = () => hasContent(icon()) || hasContent(title()) || hasContent(description())

  return (
    <>
      <Show when={showHeader()}>
        <Dialog.Header {...headerSlot}>
          <Show when={icon()}>
            {(current) => (
              <Show
                when={variants.center}
                fallback={<Icon name={current()} data-slot="alert-dialog-icon" {...iconSlot} />}
              >
                <div class={ALERT_DIALOG_CENTER_ICON_CLASS}>
                  <Icon name={current()} data-slot="alert-dialog-icon" {...iconSlot} />
                </div>
              </Show>
            )}
          </Show>
          <div data-slot="alert-dialog-copy" {...copySlot}>
            <Show when={hasContent(title())}>
              <Dialog.Title>{title()}</Dialog.Title>
            </Show>
            <Show when={hasContent(description())}>
              <Dialog.Description>{description()}</Dialog.Description>
            </Show>
          </div>
        </Dialog.Header>
      </Show>
      <Dialog.Footer {...footerSlot}>
        <Show when={showsCancel(props.record.mode, options().cancel)}>
          <FeedbackActionButton
            action={cancelConfig()}
            label={messages().cancel}
            variant="outline"
            tone="neutral"
            loading={props.record.pending() === 'cancel'}
            disabled={props.record.pending() === 'action'}
            slotName="alert-dialog-cancel"
            {...cancelSlot}
            onClick={(event) => props.record.presentation.cancel(event)}
          />
        </Show>
        <FeedbackActionButton
          action={options().action}
          label={messages().ok}
          variant="solid"
          tone={options().danger ? 'danger' : 'primary'}
          loading={props.record.pending() === 'action'}
          disabled={props.record.pending() === 'cancel'}
          slotName="alert-dialog-action"
          {...actionSlot}
          onClick={(event) => props.record.presentation.action(event)}
        />
      </Dialog.Footer>
    </>
  )
}

export function AlertDialogEntry(props: {
  record: AlertDialogRecord
  dialogRender: () => Component<AlertDialogT.DialogRenderProps> | undefined
}): JSX.Element {
  const options = () => props.record.options()
  const customRender = () => props.record.render ?? props.dialogRender()
  const recipe = createAlertDialogRecipe(options)
  const {
    slots: { content: contentSlot },
  } = recipe

  createEffect(
    on(
      () => [options().title, options().ariaLabel] as const,
      ([title, label]) => {
        if (!DEV || hasContent(title) || label) {
          return
        }
        console.warn('[moraine] AlertDialog has no accessible name. Pass title or ariaLabel.')
      },
    ),
  )

  return (
    <Dialog
      id={String(props.record.id)}
      open={props.record.open()}
      modal
      closable={(options().closable ?? false) && props.record.pending() === undefined}
      closeOnOverlayClick={
        options().closeOnOverlayClick === true && props.record.pending() === undefined
      }
      closeOnEscape={options().closeOnEscape !== false && props.record.pending() === undefined}
      onOpenChange={(next) => {
        if (!next && props.record.pending() === undefined) {
          props.record.presentation.close('dismiss')
        }
      }}
      onExitComplete={() => props.record.remove()}
    >
      <Dialog.Content
        role="alertdialog"
        aria-label={
          customRender() || !hasContent(options().title) ? options().ariaLabel : undefined
        }
        {...contentSlot}
      >
        <Show
          when={customRender()}
          keyed
          fallback={<AlertDialogDefault record={props.record} recipe={recipe} />}
        >
          {(render) => {
            const content = useDialogContent()
            useRegisteredContentId(() => props.record.presentation.titleId, content.registerTitle)
            useRegisteredContentId(
              () => props.record.presentation.descriptionId,
              content.registerDescription,
            )
            return renderWithProps(render, props.record.presentation)
          }}
        </Show>
      </Dialog.Content>
    </Dialog>
  )
}
