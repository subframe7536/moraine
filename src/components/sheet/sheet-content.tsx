import type { JSX } from 'solid-js'
import {
  Show,
  children as resolveChildren,
  createEffect,
  createMemo,
  createSignal,
  mergeProps,
  on,
  onCleanup,
  splitProps,
} from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { useRecipe } from '../../provider'
import { useLocale, useMessages } from '../../provider/locale/locale-context'
import { createLazyMemo } from '../../shared/create-lazy-memo'
import { createEventListener, createEventListenerMap } from '../../shared/event-listener'
import { hasContent } from '../../shared/jsx-content'
import { renderWithProps } from '../../shared/render-with-props'
import type { ValidComponent } from '../../shared/types'
import { Icon } from '../icon'
import { Modal } from '../modal/modal'
import { createModalContentBinding } from '../modal/modal-content-binding'
import { useModalContext } from '../modal/modal-context'
import { ModalPortal } from '../modal/modal-portal'
import { createContentAnatomy } from '../shared/overlay/content-anatomy'
import { getActiveElement } from '../shared/overlay/dom'
import { createShorthandContent } from '../shared/overlay/shorthand-content'

import { SheetContentProvider, useSheetContext } from './sheet-context'
import { SheetDescription } from './sheet-description'
import { SheetShorthandHeader } from './sheet-header'
import { SheetTitle } from './sheet-title'
import { defaultSheetMessages } from './sheet.messages'
import { sheetDataAttributes, sheetRecipe } from './sheet.recipe'
import type { SheetT } from './sheet.types'

export function SheetContent<T extends ValidComponent = 'div'>(
  props: SheetT.ContentProps<T>,
): JSX.Element {
  const [local, rest] = splitProps(props as SheetT.ContentProps<T> & { ref?: unknown }, [
    'as',
    'ref',
    'title',
    'description',
    'children',
    'class',
    'style',
  ])
  const sheet = useSheetContext()
  const messages = useMessages('sheet', defaultSheetMessages, () => sheet.translations)
  const direction = useLocale().dir
  const family = useModalContext()
  const binding = createModalContentBinding(family, {
    ref: () => local.ref,
    onKeyDown: () =>
      rest.onKeyDown as JSX.EventHandlerUnion<HTMLElement, KeyboardEvent> | undefined,
  })
  const merged = mergeProps(
    { overlay: true, transition: true, closable: true, closeIcon: 'icon-close' as const },
    sheet,
  )
  const isOverlay = () => merged.overlay !== false
  const [keyboardInset, setKeyboardInset] = createSignal(0)
  const {
    slots: { content: contentSlot, contentClose: contentCloseSlot, overlay: overlaySlot },
    variants,
  } = useRecipe(sheetRecipe, local, {
    slot: 'content',
    data: {
      content: sheetDataAttributes.content({
        closed: () => !family.open(),
        expanded: family.open,
        transition: () => merged.transition,
      }),
      overlay: sheetDataAttributes.overlay({
        overlayScroll: undefined,
        expanded: family.open,
        closed: () => !family.open(),
      }),
    },
    context: () => ({ variants: { side: sheet.side, inset: sheet.inset }, ...sheet.slotOverrides }),
    own: { content: () => ({ style: { '--sheet-keyboard-inset': `${keyboardInset()}px` } }) },
  })
  const registration = createContentAnatomy()

  createEffect(
    on([family.open, family.contentElement], ([isOpen, content]) => {
      if (!isOpen || !content) {
        return
      }

      const ownerWindow = content.ownerDocument.defaultView
      if (!ownerWindow?.visualViewport) {
        return
      }

      const surface = content
      const view = ownerWindow
      const keyboardViewport = ownerWindow.visualViewport
      function update(): void {
        const inset = Math.max(
          0,
          Math.round(view.innerHeight - keyboardViewport.height - keyboardViewport.offsetTop),
        )
        setKeyboardInset(inset)
        if (inset <= 0) {
          return
        }

        const active = getActiveElement(surface.ownerDocument)
        if (active instanceof view.HTMLElement && surface.contains(active)) {
          active.scrollIntoView({ block: 'nearest', inline: 'nearest' })
        }
      }

      update()
      createEventListenerMap(keyboardViewport, {
        resize: update,
        scroll: update,
      })
      createEventListener(view, 'resize', update)
      onCleanup(() => {
        setKeyboardInset(0)
      })
    }),
  )

  const ariaLabel = () => (rest as { 'aria-label'?: string })['aria-label']
  const ariaLabelledBy = () =>
    ariaLabel() === undefined ? registration.titleIds().join(' ') || undefined : undefined
  const ariaDescribedBy = () => registration.descriptionIds().join(' ') || undefined

  function RenderSheetContent(): JSX.Element {
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
        data-slot="sheet-content"
        role="dialog"
        dir={direction()}
        id={family.contentId()}
        tabIndex={binding.tabIndex}
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
          <Modal.Close
            data-slot="sheet-content-close"
            aria-label={messages().close}
            {...contentCloseSlot}
          >
            <Icon name={closeIcon()} />
          </Modal.Close>
        </Show>
        {explicitChildren()}
      </Dynamic>
    )
  }

  return (
    <SheetContentProvider
      value={{
        ...registration,
        get variants() {
          return variants
        },
      }}
    >
      <ModalPortal>
        <div
          data-slot={isOverlay() ? 'sheet-overlay' : undefined}
          {...(isOverlay() ? overlaySlot : undefined)}
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
        >
          <RenderSheetContent />
        </div>
      </ModalPortal>
    </SheetContentProvider>
  )
}
