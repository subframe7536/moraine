import type { JSX } from '@solidjs/web'
import { Dynamic } from '@solidjs/web'
import {
  Show,
  children as resolveChildren,
  createEffect,
  createMemo,
  createSignal,
  merge,
  omit,
} from 'solid-js'

import { useRecipe } from '../../provider'
import { useLocale, useMessages } from '../../provider/locale/locale-context'
import { createLazyMemo } from '../../shared/create-lazy-memo'
import { bindElement } from '../../shared/element-binding'
import { hasContent } from '../../shared/jsx-content'
import { renderWithProps } from '../../shared/render-with-props'
import type { ValidComponent } from '../../shared/types'
import { pick } from '../../shared/utils'
import { BaseDialog } from '../base-dialog/base-dialog'
import { createBaseDialogContentBinding } from '../base-dialog/base-dialog-content-binding'
import { useBaseDialogContext } from '../base-dialog/base-dialog-context'
import { BaseDialogPortal } from '../base-dialog/base-dialog-portal'
import { Icon } from '../icon'
import { createShorthandContent } from '../shared/overlay/shorthand-content'

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
/**
 * Portaled surface of a `Dialog` that renders the overlay, the dialog panel, and a corner close
 * button. Pass `title` and `description` for the default header, or compose `Dialog.Header`,
 * `Dialog.Title`, and `Dialog.Description` yourself (an explicit `Dialog.Header` replaces the
 * generated one). Children can be JSX or a function that receives `close`. Give it an accessible
 * name with a `Dialog.Title`, the `title` prop, or `aria-label`. Renders a `div`; pass `as` to
 * change the element.
 *
 * @example
 * ```tsx
 * import { Button, Dialog } from 'moraine'
 *
 * <Dialog>
 *   <Dialog.Trigger as={Button}>Open</Dialog.Trigger>
 *   <Dialog.Content title="Settings" description="Update your account.">
 *     <Dialog.Body>Preferences</Dialog.Body>
 *     <Dialog.Footer>
 *       <Dialog.Close as={Button}>Done</Dialog.Close>
 *     </Dialog.Footer>
 *   </Dialog.Content>
 * </Dialog>
 * ```
 */
export function DialogContent<T extends ValidComponent = 'div'>(
  props: DialogT.ContentProps<T>,
): JSX.Element {
  const local = pick(
    props as DialogT.ContentProps<T> & { ref?: unknown; dir?: unknown },
    'as',
    'ref',
    'title',
    'description',
    'children',
    'class',
    'style',
    'dir',
  )
  const rest = omit(
    props as DialogT.ContentProps<T> & { ref?: unknown; dir?: unknown },
    'as',
    'ref',
    'title',
    'description',
    'children',
    'class',
    'style',
    'dir',
  )
  const dialog = useDialogContext()
  const messages = useMessages('dialog', defaultDialogMessages, () => dialog.translations)
  const direction = useLocale().dir
  const family = useBaseDialogContext()
  const merged = merge({ overlay: true, closable: true, closeIcon: 'icon-close' as const }, dialog)
  const isOverlay = () => merged.overlay !== false
  const {
    slots: { content: contentSlot, contentClose: contentCloseSlot, overlay: overlaySlot },
    variants,
  } = useRecipe(dialogRecipe, local, {
    slot: 'content',
    data: {
      content: dialogDataAttributes.content({
        expanded: family.open,
        closed: () => !family.open(),
        transition: family.transition,
      }),
      overlay: dialogDataAttributes.overlay(() => ({
        overlayScroll,
        expanded: family.open,
        closed: () => !family.open(),
        transition: family.transition,
      })),
    },
    context: () => ({
      variants: { fullscreen: dialog.fullscreen, scrollable: dialog.scrollable },
      ...dialog.slotOverrides,
    }),
  })
  const registration = createDialogContentRegistration()
  const overlayScroll = () => variants.scrollable && isOverlay() && !variants.fullscreen

  createEffect(overlayScroll, (scrollable) => {
    family.setOverlayScroll(scrollable)
    return () => family.setOverlayScroll(false)
  })

  const ariaLabel = () => (rest as { 'aria-label'?: string })['aria-label']
  const ariaLabelledBy = () =>
    ariaLabel() === undefined ? registration.titleIds().join(' ') || undefined : undefined
  const ariaDescribedBy = () => registration.descriptionIds().join(' ') || undefined

  function RenderDialogOverlay(): JSX.Element {
    const [overlay, setOverlay] = createSignal<HTMLDivElement>()
    // Only the backdrop element animates as part of the presence; a plain wrapper does not.
    bindElement(() => isOverlay() && overlay(), family.presence.registerElement)
    return (
      <div
        data-slot={isOverlay() ? 'dialog-overlay' : undefined}
        {...(isOverlay() ? overlaySlot : undefined)}
        ref={setOverlay}
      >
        <RenderDialogContent />
      </div>
    )
  }

  function RenderDialogContent(): JSX.Element {
    // The portal branch owns the content binding, so it releases when the content unmounts.
    const binding = createBaseDialogContentBinding(family, {
      ref: () => local.ref as ((element: HTMLDivElement) => void) | HTMLDivElement | undefined,
      onKeyDown: () =>
        rest.onKeyDown as JSX.EventHandlerUnion<HTMLElement, KeyboardEvent> | undefined,
    })
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
        dir={local.dir ?? direction()}
        id={family.contentId()}
        tabindex={binding.tabIndex}
        aria-modal={binding.ariaModal()}
        aria-labelledby={ariaLabelledBy()}
        aria-describedby={ariaDescribedBy()}
        {...contentSlot}
        {...rest}
        ref={binding.ref}
        onKeyDown={binding.onKeyDown}
      >
        <Show when={!registration.hasExplicitHeader() && contentShorthand.hasContent()}>
          <DialogShorthandHeader>
            <Show when={hasContent(contentShorthand.title())}>
              <DialogTitle>{contentShorthand.title()}</DialogTitle>
            </Show>
            <Show when={hasContent(contentShorthand.description())}>
              <DialogDescription>{contentShorthand.description()}</DialogDescription>
            </Show>
          </DialogShorthandHeader>
        </Show>
        <Show when={merged.closable}>
          <BaseDialog.Close
            data-slot="dialog-content-close"
            aria-label={messages().close}
            {...contentCloseSlot}
          >
            <Icon name={closeIcon()} />
          </BaseDialog.Close>
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
      <BaseDialogPortal>
        <RenderDialogOverlay />
      </BaseDialogPortal>
    </DialogContentProvider>
  )
}
