import type { JSX } from 'solid-js'
import {
  Show,
  children as resolveChildren,
  createEffect,
  createMemo,
  mergeProps,
  on,
  onCleanup,
  splitProps,
} from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { Icon } from '../../element/icon'
import { useRecipe } from '../../provider'
import { useLocale, useMessages } from '../../provider/locale/locale-context'
import { createLazyMemo } from '../../shared/create-lazy-memo'
import { hasJsxContent } from '../../shared/jsx-content'
import { renderWithProps } from '../../shared/render-with-props'
import type { ValidComponent } from '../../shared/types'
import { createShorthandContent } from '../base/shorthand-content'
import { Modal } from '../modal/modal'
import { createModalContentBinding } from '../modal/modal-content-binding'
import { useModalContext } from '../modal/modal-context'
import { ModalPortal } from '../modal/modal-portal'

import {
  DialogContentProvider,
  createDialogContentRegistration,
  useDialogContext,
} from './dialog-context'
import { DialogDescription } from './dialog-description'
import { DialogShorthandHeader } from './dialog-header'
import { DialogTitle } from './dialog-title'
import { defaultDialogMessages } from './dialog.messages'
import { dialogDataAttributes, dialogRecipe } from './dialog.recipe'
import type { DialogT } from './dialog.types'

export function DialogContent<T extends ValidComponent = 'div'>(
  props: DialogT.ContentProps<T>,
): JSX.Element {
  const [local, rest] = splitProps(props as DialogT.ContentProps<T> & { ref?: unknown }, [
    'as',
    'ref',
    'title',
    'description',
    'children',
    'class',
    'style',
  ])
  const dialog = useDialogContext()
  const messages = useMessages('dialog', defaultDialogMessages)
  const direction = useLocale().dir
  const family = useModalContext()
  const binding = createModalContentBinding(family, {
    ref: () => local.ref,
    onKeyDown: () =>
      rest.onKeyDown as JSX.EventHandlerUnion<HTMLElement, KeyboardEvent> | undefined,
  })
  const merged = mergeProps(
    { overlay: true, closable: true, closeIcon: 'icon-close' as const },
    dialog,
  )
  const isOverlay = () => merged.overlay !== false
  const { slots, variants } = useRecipe(dialogRecipe, local, {
    slot: 'content',
    contextVariants: () => ({ fullscreen: dialog.fullscreen, scrollable: dialog.scrollable }),
    contextSlots: () => dialog.slotOverrides,
  })
  const registration = createDialogContentRegistration()
  const overlayScroll = () => variants.scrollable && isOverlay() && !variants.fullscreen

  createEffect(on(overlayScroll, family.setOverlayScroll))
  onCleanup(() => family.setOverlayScroll(false))

  const ariaLabel = () => (rest as { 'aria-label'?: string })['aria-label']
  const ariaLabelledBy = () =>
    ariaLabel() === undefined ? registration.titleIds().join(' ') || undefined : undefined
  const ariaDescribedBy = () => registration.descriptionIds().join(' ') || undefined

  function RenderDialogContent(): JSX.Element {
    const contentShorthand = createShorthandContent(local)
    const child = resolveChildren(() => local.children)
    const explicitChildren = createMemo(() =>
      renderWithProps(child(), {
        close: () => family.updateOpen(false),
      }),
    )
    const closeIcon = createLazyMemo(() => merged.closeIcon)
    const tag = (): ValidComponent => local.as ?? 'div'

    return (
      <Dynamic
        component={tag()}
        data-slot="dialog-content"
        role="dialog"
        dir={direction()}
        id={family.contentId()}
        tabIndex={binding.tabIndex}
        aria-modal={binding.ariaModal()}
        aria-labelledby={ariaLabelledBy()}
        aria-describedby={ariaDescribedBy()}
        {...dialogDataAttributes.content({
          expanded: family.open,
          closed: () => !family.open(),
        })}
        {...rest}
        {...slots.content}
        ref={binding.ref}
        onKeyDown={binding.onKeyDown}
      >
        <Show when={!registration.hasExplicitHeader() && contentShorthand.hasContent()}>
          <DialogShorthandHeader>
            <Show when={hasJsxContent(contentShorthand.title())}>
              <DialogTitle>{contentShorthand.title()}</DialogTitle>
            </Show>
            <Show when={hasJsxContent(contentShorthand.description())}>
              <DialogDescription>{contentShorthand.description()}</DialogDescription>
            </Show>
          </DialogShorthandHeader>
        </Show>
        <Show when={merged.closable}>
          <Modal.Close
            data-slot="dialog-content-close"
            aria-label={messages().close}
            {...slots.contentClose}
          >
            <Icon name={closeIcon()} />
          </Modal.Close>
        </Show>
        {explicitChildren()}
      </Dynamic>
    )
  }

  return (
    <DialogContentProvider
      value={{
        ...registration,
        get variants() {
          return variants
        },
        overlayScroll,
      }}
    >
      <ModalPortal>
        <div
          data-slot={isOverlay() ? 'dialog-overlay' : undefined}
          {...(isOverlay()
            ? dialogDataAttributes.overlay({
                overlayScroll,
                expanded: family.open,
                closed: () => !family.open(),
              })
            : {})}
          ref={(element) => {
            let unregister: (() => void) | undefined
            createEffect(
              on(isOverlay, (overlayActive) => {
                unregister?.()
                unregister = overlayActive ? family.presence.registerElement(element) : undefined
              }),
            )
            onCleanup(() => {
              unregister?.()
            })
          }}
          {...(isOverlay() ? slots.overlay : undefined)}
        >
          <RenderDialogContent />
        </div>
      </ModalPortal>
    </DialogContentProvider>
  )
}
