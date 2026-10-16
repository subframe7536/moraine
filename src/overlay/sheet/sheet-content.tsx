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

import { Icon } from '../../element/icon'
import { useRecipe } from '../../provider'
import { useLocale, useMessages } from '../../provider/locale/locale-context'
import { createLazyMemo } from '../../shared/create-lazy-memo'
import { createEventListener, createEventListenerMap } from '../../shared/event-listener'
import { hasJsxContent } from '../../shared/jsx-content'
import { renderWithProps } from '../../shared/render-with-props'
import { createContentAnatomy } from '../base/content-anatomy'
import { getActiveElement } from '../base/dom'
import { createShorthandContent } from '../base/shorthand-content'
import { Modal } from '../modal/modal'
import { createModalContentBinding } from '../modal/modal-content-binding'
import { useModalContext } from '../modal/modal-context'
import { ModalPortal } from '../modal/modal-portal'

import { SheetContentProvider, useSheetContext } from './sheet-context'
import { SheetDescription } from './sheet-description'
import { SheetShorthandHeader } from './sheet-header'
import { SheetTitle } from './sheet-title'
import { defaultSheetMessages } from './sheet.messages'
import { sheetDataAttributes, sheetRecipe } from './sheet.recipe'
import type { SheetT } from './sheet.types'

export function SheetContent(props: SheetT.ContentProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    'ref',
    'title',
    'description',
    'children',
    'class',
    'style',
    'aria-label',
    'dir',
  ])
  const sheet = useSheetContext()
  const messages = useMessages('sheet', defaultSheetMessages)
  const direction = useLocale().dir
  const family = useModalContext()
  const binding = createModalContentBinding(family, {
    ref: () => local.ref,
    onKeyDown: () => rest.onKeyDown,
  })
  const merged = mergeProps(
    { overlay: true, transition: true, close: true, closeIcon: 'icon-close' as const },
    sheet,
  )
  const isOverlay = () => merged.overlay !== false
  const [keyboardInset, setKeyboardInset] = createSignal(0)
  const { slots, variants } = useRecipe(sheetRecipe, local, {
    slot: 'content',
    contextVariants: () => ({ side: sheet.side, inset: sheet.inset }),
    contextSlots: () => sheet.slotOverrides,
    vars: () => ({ '--sheet-keyboard-inset': `${keyboardInset()}px` }),
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

  const ariaLabel = () => local['aria-label']
  const ariaLabelledBy = () =>
    ariaLabel() === undefined ? registration.titleIds().join(' ') || undefined : undefined
  const ariaDescribedBy = () => registration.descriptionIds().join(' ') || undefined

  function RenderSheetContent(): JSX.Element {
    const contentShorthand = createShorthandContent(local)
    const child = resolveChildren(() => local.children as JSX.Element)
    const explicitChildren = createMemo(() =>
      renderWithProps(child(), {
        close: () => family.updateOpen(false),
      }),
    )
    const closeIcon = createLazyMemo(() => merged.closeIcon)

    return (
      <div
        data-slot="sheet-content"
        role="dialog"
        id={family.contentId()}
        tabIndex={binding.tabIndex}
        aria-modal={binding.ariaModal()}
        aria-label={ariaLabel()}
        aria-labelledby={ariaLabelledBy()}
        aria-describedby={ariaDescribedBy()}
        {...sheetDataAttributes.content({
          closed: undefined,
          expanded: undefined,
          transition: () => merged.transition,
        })}
        {...rest}
        {...slots.content}
        dir={local.dir ?? direction()}
        ref={binding.ref}
        onKeyDown={binding.onKeyDown}
      >
        <Show when={!registration.hasExplicitHeader() && contentShorthand.hasContent()}>
          <SheetShorthandHeader>
            <Show when={hasJsxContent(contentShorthand.title())}>
              <SheetTitle>{contentShorthand.title()}</SheetTitle>
            </Show>
            <Show when={hasJsxContent(contentShorthand.description())}>
              <SheetDescription>{contentShorthand.description()}</SheetDescription>
            </Show>
          </SheetShorthandHeader>
        </Show>
        <Show when={merged.close}>
          <Modal.Close
            data-slot="sheet-content-close"
            aria-label={messages().close}
            {...slots.contentClose}
          >
            <Icon name={closeIcon()} />
          </Modal.Close>
        </Show>
        {explicitChildren()}
      </div>
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
          {...(isOverlay()
            ? sheetDataAttributes.overlay({
                overlayScroll: undefined,
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
          <RenderSheetContent />
        </div>
      </ModalPortal>
    </SheetContentProvider>
  )
}
