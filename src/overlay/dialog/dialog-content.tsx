import type { JSX } from 'solid-js'
import { Show, mergeProps, splitProps, untrack } from 'solid-js'

import { Icon } from '../../element/icon'
import { createStyles } from '../../provider'
import { useLocale, useMessages } from '../../provider/locale/locale-context'
import { createLazyMemo } from '../../shared/create-lazy-memo'
import { hasJsxContent } from '../../shared/jsx-content'
import { createShorthandContent } from '../base/shorthand-content'
import { Modal } from '../modal/modal'
import { useModalContext } from '../modal/modal-context'
import { ModalPortal } from '../modal/modal-portal'

import {
  DialogContentProvider,
  createDialogContentRegistration,
  useDialogConfig,
} from './dialog-context'
import { DialogDescription } from './dialog-description'
import { DialogShorthandHeader } from './dialog-header'
import { DialogTitle } from './dialog-title'
import { defaultDialogMessages } from './dialog.messages'
import { dialogRecipe } from './dialog.recipe'
import type { DialogT } from './dialog.types'

export function DialogContent(props: DialogT.ContentProps): JSX.Element {
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
  const config = useDialogConfig()
  const messages = useMessages('dialog', defaultDialogMessages)
  const direction = useLocale().dir
  const family = useModalContext()
  const merged = mergeProps(
    { overlay: true, close: true, closeIcon: 'icon-close' as const },
    config,
  )
  const resolved = createStyles(dialogRecipe, local, {
    rootSlot: 'content',
    inheritedVariants: () => ({ fullscreen: config.fullscreen, scrollable: config.scrollable }),
    inheritedStyles: () => family.presentation,
  })
  const registration = createDialogContentRegistration()
  const overlayScroll = () =>
    resolved.variants.scrollable && merged.overlay && !resolved.variants.fullscreen

  return (
    <DialogContentProvider
      value={{
        ...registration,
        get variants() {
          return resolved.variants
        },
        overlayScroll,
      }}
    >
      <ModalPortal>
        <Modal.Overlay
          overlay={merged.overlay}
          scrollable={overlayScroll()}
          class={resolved.styles.overlay.class}
          style={resolved.styles.overlay.style}
        >
          <Modal.Content
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
                    <DialogShorthandHeader>
                      <Show when={hasJsxContent(contentShorthand.title())}>
                        <DialogTitle>{contentShorthand.title()}</DialogTitle>
                      </Show>
                      <Show when={hasJsxContent(contentShorthand.description())}>
                        <DialogDescription>{contentShorthand.description()}</DialogDescription>
                      </Show>
                    </DialogShorthandHeader>
                  </Show>
                  <Show when={merged.close}>
                    <Modal.Close
                      data-slot="dialog-content-close"
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
    </DialogContentProvider>
  )
}
