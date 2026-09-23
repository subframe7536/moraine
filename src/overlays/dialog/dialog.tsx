import type { JSX } from 'solid-js'
import { Show, children as resolveChildren, mergeProps, splitProps } from 'solid-js'

import { Icon } from '../../elements/icon'
import { createStyles } from '../../provider'
import { createLazyMemo } from '../../shared/create-lazy-memo'
import { hasJsxContent } from '../../shared/jsx-content'
import type { ValidComponent } from '../../shared/types.ts'
import { Modal } from '../modal/modal'
import { ModalSurface } from '../modal/modal-content'
import { ModalSlotOwner, useModalContext } from '../modal/modal-context'

import { DialogPresentationProvider, useDialogPresentation } from './dialog-context'
import { dialogDataAttributes, dialogRecipe } from './dialog.recipe'
import type { DialogProps, DialogT } from './dialog.types'

/** Dialog state and context. Trigger, Content, and Close own their respective DOM. */
export function Dialog(props: DialogProps): JSX.Element {
  const [local, rest] = splitProps(props, ['classes', 'styles', 'children'])
  return (
    <DialogPresentationProvider
      value={{
        get presentation() {
          return { classes: local.classes, styles: local.styles }
        },
      }}
    >
      <ModalSlotOwner value="dialog">
        <Modal {...rest}>{local.children}</Modal>
      </ModalSlotOwner>
    </DialogPresentationProvider>
  )
}

function DialogTrigger<T extends ValidComponent = 'button'>(
  props: DialogT.TriggerProps<T>,
): JSX.Element {
  const family = useDialogPresentation()
  const resolved = createStyles(dialogRecipe, props, {
    rootSlot: 'trigger',
    inheritedStyles: () => family.presentation,
  })
  return <Modal.Trigger {...props} {...resolved.styles.trigger} />
}

function DialogClose<T extends ValidComponent = 'button'>(
  props: DialogT.CloseProps<T>,
): JSX.Element {
  return <Modal.Close {...props} data-slot="dialog-close" />
}

function DialogContent(props: DialogT.ContentProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    'overlay',
    'ariaLabel',
    'title',
    'description',
    'fullscreen',
    'scrollable',
    'close',
    'closeIcon',
    'header',
    'body',
    'footer',
    'children',
    'classes',
    'styles',
    'class',
    'style',
  ])

  const context = useModalContext()
  const family = useDialogPresentation()
  const merged = mergeProps(
    { overlay: true, close: true, closeIcon: 'icon-close' as const },

    local,
  )
  const resolved = createStyles(dialogRecipe, local, {
    rootSlot: 'content',
    inheritedStyles: () => family.presentation,
  })
  const overlayScroll = () =>
    resolved.variants.scrollable && merged.overlay && !resolved.variants.fullscreen

  return (
    <ModalSurface
      {...rest}
      overlay={merged.overlay}
      overlayScroll={overlayScroll()}
      overlayClass={resolved.styles.overlay.class}
      overlayStyle={resolved.styles.overlay.style}
      {...resolved.styles.content}
      surfaceRender={() => {
        const title = createLazyMemo(() => merged.title)
        const description = createLazyMemo(() => merged.description)
        const header = createLazyMemo(() => merged.header)
        const body = createLazyMemo(() => {
          const explicitBody = merged.body
          return explicitBody === undefined
            ? resolveChildren(() => merged.children)()
            : explicitBody
        })
        const footer = createLazyMemo(() => merged.footer)
        const closeIcon = createLazyMemo(() => merged.closeIcon)
        const hasCustomHeader = () => hasJsxContent(header())
        const titleId = () =>
          !hasCustomHeader() && hasJsxContent(title()) ? `${context.contentId()}-title` : undefined
        const descriptionId = () =>
          !hasCustomHeader() && hasJsxContent(description())
            ? `${context.contentId()}-description`
            : undefined
        const hasHeader = () =>
          hasCustomHeader() || hasJsxContent(title()) || hasJsxContent(description())

        return {
          ariaLabel: merged.ariaLabel,
          ariaLabelledBy: titleId(),
          ariaDescribedBy: descriptionId(),
          children: () => (
            <>
              <Show when={hasHeader()}>
                <div data-slot="dialog-header" {...resolved.styles.header}>
                  <Show
                    when={hasCustomHeader()}
                    fallback={
                      <>
                        <Show when={hasJsxContent(title())}>
                          <h2 id={titleId()} data-slot="dialog-title" {...resolved.styles.title}>
                            {title()}
                          </h2>
                        </Show>
                        <Show when={hasJsxContent(description())}>
                          <p
                            id={descriptionId()}
                            data-slot="dialog-description"
                            {...resolved.styles.description}
                          >
                            {description()}
                          </p>
                        </Show>
                      </>
                    }
                  >
                    {header()}
                  </Show>
                </div>
              </Show>
              <Show when={merged.close}>
                <Modal.Close
                  data-slot="dialog-content-close"
                  aria-label="Close"
                  {...resolved.styles.contentClose}
                >
                  <Icon name={closeIcon()} />
                </Modal.Close>
              </Show>
              <Show when={hasJsxContent(body())}>
                <div
                  data-slot="dialog-body"
                  {...dialogDataAttributes.body({
                    scroll: () => !overlayScroll(),
                    header: hasHeader,
                    footer: () => hasJsxContent(footer()),
                  })}
                  {...resolved.styles.body}
                >
                  {body()}
                </div>
              </Show>
              <Show when={hasJsxContent(footer())}>
                <div data-slot="dialog-footer" {...resolved.styles.footer}>
                  {footer()}
                </div>
              </Show>
            </>
          ),
        }
      }}
    />
  )
}

Dialog.Trigger = DialogTrigger
Dialog.Content = DialogContent
Dialog.Close = DialogClose
