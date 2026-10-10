import type { JSX } from 'solid-js'
import {
  Show,
  createEffect,
  createSignal,
  mergeProps,
  on,
  onCleanup,
  splitProps,
  untrack,
} from 'solid-js'

import { Icon } from '../../element/icon'
import { createStyles } from '../../provider'
import { useLocale, useMessages } from '../../provider/locale/locale-context'
import { createLazyMemo } from '../../shared/create-lazy-memo'
import { createEventListener, createEventListenerMap } from '../../shared/event-listener'
import { hasJsxContent } from '../../shared/jsx-content'
import { createContentAnatomy } from '../base/content-anatomy'
import { getActiveElement } from '../base/dom'
import { createShorthandContent } from '../base/shorthand-content'
import { Modal } from '../modal/modal'
import { useModalContext } from '../modal/modal-context'
import { ModalPortal } from '../modal/modal-portal'

import { SheetContentProvider, useSheetConfig } from './sheet-context'
import { SheetDescription } from './sheet-description'
import { SheetShorthandHeader } from './sheet-header'
import { SheetTitle } from './sheet-title'
import { defaultSheetMessages } from './sheet.messages'
import { sheetDataAttributes, sheetRecipe } from './sheet.recipe'
import type { SheetT } from './sheet.types'

export function SheetContent(props: SheetT.ContentProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    'title',
    'description',
    'children',
    'classes',
    'styles',
    'class',
    'style',
    'aria-label',
  ])
  const config = useSheetConfig()
  const messages = useMessages('sheet', defaultSheetMessages)
  const direction = useLocale().dir
  const family = useModalContext()
  const merged = mergeProps(
    { overlay: true, transition: true, close: true, closeIcon: 'icon-close' as const },
    config,
  )
  const [keyboardInset, setKeyboardInset] = createSignal(0)
  const resolved = createStyles(sheetRecipe, local, {
    rootSlot: 'content',
    inheritedVariants: () => ({ side: config.side, inset: config.inset }),
    inheritedStyles: () => family.presentation,
    variables: () => ({ '--sheet-keyboard-inset': `${keyboardInset()}px` }),
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

  return (
    <SheetContentProvider
      value={{
        ...registration,
        get variants() {
          return resolved.variants
        },
      }}
    >
      <ModalPortal>
        <Modal.Overlay
          overlay={merged.overlay}
          class={resolved.styles.overlay.class}
          style={resolved.styles.overlay.style}
        >
          <Modal.Content
            {...sheetDataAttributes.content({
              closed: undefined,
              expanded: undefined,
              transition: () => merged.transition,
            })}
            {...rest}
            dir={rest.dir ?? direction()}
            class={resolved.styles.content.class}
            style={resolved.styles.content.style}
            ariaLabel={local['aria-label'] ?? merged.ariaLabel}
            ariaLabelledBy={
              (local['aria-label'] ?? merged.ariaLabel) === undefined
                ? registration.titleIds().join(' ') || undefined
                : undefined
            }
            ariaDescribedBy={registration.descriptionIds().join(' ') || undefined}
          >
            {(_props) => {
              const contentShorthand = createShorthandContent(local)
              const explicitChildren = createLazyMemo(() => untrack(() => local.children))
              const closeIcon = createLazyMemo(() => merged.closeIcon)
              const content = explicitChildren()
              return (
                <>
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
                      {...resolved.styles.contentClose}
                    >
                      <Icon name={closeIcon()} />
                    </Modal.Close>
                  </Show>
                  {content}
                </>
              )
            }}
          </Modal.Content>
        </Modal.Overlay>
      </ModalPortal>
    </SheetContentProvider>
  )
}
