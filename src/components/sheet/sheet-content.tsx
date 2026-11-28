import type { JSX } from '@solidjs/web'
import { dynamic } from '@solidjs/web'
import { Show, createEffect, createMemo, createSignal, merge, omit } from 'solid-js'

import { useRecipe } from '../../provider'
import { useLocale, useMessages } from '../../provider/locale/locale-context'
import { hasContent } from '../../shared/jsx-content'
import { renderWithProps } from '../../shared/render-with-props'
import type { ValidComponent } from '../../shared/types'
import { mergeDefinedProps, resolvePropsChildren } from '../../shared/utils'
import { BaseDialog } from '../base-dialog/base-dialog'
import { createBaseDialogContentBinding } from '../base-dialog/base-dialog-content-binding'
import { useBaseDialogContext } from '../base-dialog/base-dialog-context'
import { BaseDialogPortal } from '../base-dialog/base-dialog-portal'
import { Icon } from '../icon'
import { createContentAnatomy } from '../shared/overlay/content-anatomy'
import { createKeyboardInset } from '../shared/overlay/keyboard-inset'
import { createShorthandContent } from '../shared/overlay/shorthand-content'

import { SheetProvider, useSheetContext } from './sheet-context'
import { SheetDescription } from './sheet-description'
import { SheetShorthandHeader } from './sheet-header'
import { SheetTitle } from './sheet-title'
import { defaultSheetMessages } from './sheet.messages'
import { sheetDataAttributes, sheetRecipe } from './sheet.recipe'
import type { SheetT } from './sheet.types'
/**
 * Portaled surface of the surrounding `Sheet`, rendered with `role="dialog"` together with its
 * overlay. Pass `title` and `description` for the default header, or compose `Sheet.Header`,
 * `Sheet.Body`, and `Sheet.Footer` yourself; children may also be a function receiving `close`.
 * Renders a `div` by default; pass `as` to change the element.
 *
 * @example
 * ```tsx
 * import { Button, Sheet } from 'moraine'
 *
 * <Sheet>
 *   <Sheet.Trigger as={Button}>Open</Sheet.Trigger>
 *   <Sheet.Content title="Settings" description="Update your account.">
 *     <Sheet.Body>Preferences</Sheet.Body>
 *   </Sheet.Content>
 * </Sheet>
 * ```
 */
export function SheetContent<T extends ValidComponent = 'div'>(
  props: SheetT.ContentProps<T>,
): JSX.Element {
  const local = props as SheetT.ContentProps<T> & { ref?: unknown; dir?: unknown }
  const rest = omit(
    props as SheetT.ContentProps<T> & { ref?: unknown; dir?: unknown },
    'as',
    'ref',
    'title',
    'description',
    'children',
    'class',
    'style',
    'dir',
  )
  const sheet = useSheetContext()
  const messages = useMessages('sheet', defaultSheetMessages, () => sheet.translations)
  const direction = useLocale().dir
  const family = useBaseDialogContext()
  const merged = mergeDefinedProps(
    { overlay: true, closable: true, closeIcon: 'icon-close' as const },
    sheet,
  )
  const isOverlay = () => merged.overlay !== false
  const keyboardInset = createKeyboardInset(family.open, family.contentElement)
  const {
    slots: { content: contentSlot, contentClose: contentCloseSlot, overlay: overlaySlot },
    variants,
  } = useRecipe(sheetRecipe, local, {
    slot: 'content',
    data: {
      content: sheetDataAttributes.content({
        closed: () => !family.open(),
        expanded: family.open,
        transition: family.transition,
      }),
      overlay: sheetDataAttributes.overlay({
        overlayScroll: undefined,
        expanded: family.open,
        closed: () => !family.open(),
        transition: family.transition,
      }),
    },
    context: () => ({ variants: { side: sheet.side, inset: sheet.inset }, ...sheet.slotOverrides }),
    own: { content: () => ({ style: { '--sheet-keyboard-inset': `${keyboardInset()}px` } }) },
  })
  const registration = createContentAnatomy()

  const ariaLabel = () => (rest as { 'aria-label'?: string })['aria-label']
  const ariaLabelledBy = () =>
    ariaLabel() === undefined ? registration.titleIds().join(' ') || undefined : undefined
  const ariaDescribedBy = () => registration.descriptionIds().join(' ') || undefined

  function RenderSheetOverlay(): JSX.Element {
    const [overlay, setOverlay] = createSignal<HTMLDivElement>()
    // Only the backdrop element animates as part of the presence; a plain wrapper does not.
    createEffect(
      () => (isOverlay() ? overlay() : undefined),
      (node) => {
        if (!node) {
          return
        }
        return family.presence.registerElement(node)
      },
    )
    return (
      <div
        data-slot={isOverlay() ? 'sheet-overlay' : undefined}
        {...(isOverlay() ? overlaySlot : undefined)}
        ref={setOverlay}
      >
        <RenderSheetContent />
      </div>
    )
  }

  function RenderSheetContent(): JSX.Element {
    // The portal branch owns the content binding, so it releases when the content unmounts.
    const binding = createBaseDialogContentBinding(family, {
      ref: () => local.ref as ((element: HTMLDivElement) => void) | HTMLDivElement | undefined,
      onKeyDown: () =>
        rest.onKeyDown as JSX.EventHandlerUnion<HTMLElement, KeyboardEvent> | undefined,
    })
    const contentShorthand = createShorthandContent(local)
    const child = resolvePropsChildren(local as { children?: JSX.Element })
    const explicitChildren = createMemo(() =>
      renderWithProps(child(), {
        close: () => family.updateOpen(false),
      }),
    )
    const tag = (): ValidComponent => local.as ?? 'div'
    const Root = dynamic(tag)

    return (
      <Root
        data-slot="sheet-content"
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
          <SheetShorthandHeader>
            <Show when={hasContent(contentShorthand.title())}>
              <SheetTitle>{contentShorthand.title()}</SheetTitle>
            </Show>
            <Show when={hasContent(contentShorthand.description())}>
              <SheetDescription>{contentShorthand.description()}</SheetDescription>
            </Show>
          </SheetShorthandHeader>
        </Show>
        <Show when={merged.closable}>
          <BaseDialog.Close
            data-slot="sheet-content-close"
            aria-label={messages().close}
            {...contentCloseSlot}
          >
            <Icon name={merged.closeIcon} />
          </BaseDialog.Close>
        </Show>
        {explicitChildren()}
      </Root>
    )
  }

  const sheetWithContent = merge(sheet, {
    content: {
      ...registration,
      get variants() {
        return variants
      },
    },
  })

  return (
    <SheetProvider value={sheetWithContent}>
      <BaseDialogPortal>
        <RenderSheetOverlay />
      </BaseDialogPortal>
    </SheetProvider>
  )
}
