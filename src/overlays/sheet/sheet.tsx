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

import { SheetPresentationProvider, useSheetPresentation } from './sheet-context'
import { sheetDataAttributes, sheetRecipe } from './sheet.recipe'
import type { SheetProps, SheetT } from './sheet.types'

/** Sheet state and context. Trigger, Content, and Close own their respective DOM. */
export function Sheet(props: SheetProps): JSX.Element {
  const [local, rest] = splitProps(props, ['classes', 'styles', 'children'])
  return (
    <SheetPresentationProvider
      value={{
        get presentation() {
          return { classes: local.classes, styles: local.styles }
        },
      }}
    >
      <ModalSlotOwner value="sheet">
        <Modal {...rest}>{local.children}</Modal>
      </ModalSlotOwner>
    </SheetPresentationProvider>
  )
}

function SheetTrigger<T extends ValidComponent = 'button'>(
  props: SheetT.TriggerProps<T>,
): JSX.Element {
  const family = useSheetPresentation()
  const resolved = createStyles(sheetRecipe, props, {
    rootSlot: 'trigger',
    inheritedStyles: () => family.presentation,
  })
  return <Modal.Trigger {...props} {...resolved.styles.trigger} />
}

function SheetClose<T extends ValidComponent = 'button'>(props: SheetT.CloseProps<T>): JSX.Element {
  return <Modal.Close {...props} data-slot="sheet-close" />
}

function SheetContent(props: SheetT.ContentProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    'overlay',
    'ariaLabel',
    'title',
    'description',
    'side',
    'inset',
    'transition',
    'close',
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
  const family = useSheetPresentation()

  const merged = mergeProps(
    {
      overlay: true,
      transition: true,

      close: true,
    },

    local,
  )

  const resolved = createStyles(sheetRecipe, local, {
    rootSlot: 'content',
    inheritedStyles: () => family.presentation,
  })

  return (
    <ModalSurface
      {...rest}
      {...sheetDataAttributes.content({
        closed: undefined,
        expanded: undefined,
        transition: () => merged.transition,
      })}
      overlay={merged.overlay}
      overlayClass={resolved.styles.overlay.class}
      overlayStyle={resolved.styles.overlay.style}
      class={resolved.styles.content.class}
      style={resolved.styles.content.style}
      surfaceRender={() => {
        const title = createLazyMemo(() => merged.title)
        const description = createLazyMemo(() => merged.description)
        const header = createLazyMemo(() => merged.header)
        const closeContent = createLazyMemo(() => merged.close)
        const body = createLazyMemo(() => {
          const explicitBody = merged.body
          return explicitBody === undefined
            ? resolveChildren(() => merged.children)()
            : explicitBody
        })
        const footer = createLazyMemo(() => merged.footer)
        const hasCustomHeader = () => hasJsxContent(header())
        const titleId = () =>
          !hasCustomHeader() && hasJsxContent(title()) ? `${context.contentId()}-title` : undefined
        const descriptionId = () =>
          !hasCustomHeader() && hasJsxContent(description())
            ? `${context.contentId()}-description`
            : undefined
        const hasDefaultHeader = () => hasJsxContent(title()) || hasJsxContent(description())

        return {
          ariaLabel: merged.ariaLabel,
          ariaLabelledBy: titleId(),
          ariaDescribedBy: descriptionId(),
          children: () => (
            <>
              <Show when={hasCustomHeader() || hasDefaultHeader()}>
                <div data-slot="sheet-header" {...resolved.styles.header}>
                  <Show
                    when={hasCustomHeader()}
                    fallback={
                      <>
                        <Show when={hasJsxContent(title())}>
                          <h2 id={titleId()} data-slot="sheet-title" {...resolved.styles.title}>
                            {title()}
                          </h2>
                        </Show>
                        <Show when={hasJsxContent(description())}>
                          <p
                            id={descriptionId()}
                            data-slot="sheet-description"
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

              <Show when={closeContent() !== false}>
                <Modal.Close
                  data-slot="sheet-content-close"
                  aria-label="Close"
                  {...resolved.styles.contentClose}
                >
                  <Show when={closeContent() === true} fallback={closeContent()}>
                    <Icon name="icon-close" />
                  </Show>
                </Modal.Close>
              </Show>

              <Show when={hasJsxContent(body())}>
                <div
                  data-slot="sheet-body"
                  {...sheetDataAttributes.body({
                    header: () => hasCustomHeader() || hasDefaultHeader(),
                  })}
                  {...resolved.styles.body}
                >
                  {body()}
                </div>
              </Show>

              <Show when={hasJsxContent(footer())}>
                <div data-slot="sheet-footer" {...resolved.styles.footer}>
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

Sheet.Trigger = SheetTrigger
Sheet.Content = SheetContent
Sheet.Close = SheetClose
