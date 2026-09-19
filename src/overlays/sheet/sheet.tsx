import type { JSX } from 'solid-js'
import { Show, children as resolveChildren, mergeProps, splitProps } from 'solid-js'

import { Icon } from '../../elements/icon'
import { createStyles } from '../../provider'
import { createLazyMemo } from '../../shared/create-lazy-memo'
import { hasJsxContent } from '../../shared/jsx-content'
import type { ValidComponent } from '../../shared/types.ts'
import { Modal } from '../modal/modal'
import { ModalSurface } from '../modal/modal-content'
import { useModalContext } from '../modal/modal-context'

import { sheetRecipe } from './sheet.recipe'
import type { SheetProps, SheetT } from './sheet.types'

/** Sheet state and context. Trigger, Content, and Close own their respective DOM. */
export function Sheet(props: SheetProps): JSX.Element {
  return <Modal {...props} />
}

function SheetTrigger<T extends ValidComponent = 'button'>(
  props: SheetT.TriggerProps<T>,
): JSX.Element {
  const resolved = createStyles(sheetRecipe, props, { rootSlot: 'trigger' })
  return <Modal.Trigger {...props} {...resolved.styles.trigger} />
}

function SheetClose<T extends ValidComponent = 'button'>(props: SheetT.CloseProps<T>): JSX.Element {
  const resolved = createStyles(sheetRecipe, props, { rootSlot: 'close' })
  return <Modal.Close {...props} {...resolved.styles.close} />
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
    'action',
    'children',
    'classes',
    'styles',
    'class',
    'style',
  ])

  const context = useModalContext()

  const merged = mergeProps(
    {
      overlay: true,
      transition: true,

      close: true,
    },

    local,
  )

  const resolved = createStyles(sheetRecipe, local, { rootSlot: 'content' })

  return (
    <ModalSurface
      {...rest}
      data-transition={merged.transition ? '' : undefined}
      overlay={merged.overlay}
      overlayClass={resolved.styles.overlay.class}
      overlayStyle={resolved.styles.overlay.style}
      class={resolved.styles.content.class}
      style={resolved.styles.content.style}
      surfaceRender={() => {
        const title = createLazyMemo(() => merged.title)
        const description = createLazyMemo(() => merged.description)
        const header = createLazyMemo(() => merged.header)
        const action = createLazyMemo(() => merged.action)
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
        const hasDefaultHeader = () =>
          hasJsxContent(title()) ||
          hasJsxContent(description()) ||
          hasJsxContent(action()) ||
          closeContent() !== false

        return {
          ariaLabel: merged.ariaLabel,
          ariaLabelledBy: titleId(),
          ariaDescribedBy: descriptionId(),
          children: () => (
            <>
              <Show when={hasCustomHeader() || hasDefaultHeader()}>
                <div data-slot="header" {...resolved.styles.header}>
                  <Show
                    when={hasCustomHeader()}
                    fallback={
                      <>
                        <div data-slot="wrapper" {...resolved.styles.wrapper}>
                          <Show when={hasJsxContent(title())}>
                            <h2 id={titleId()} data-slot="title" {...resolved.styles.title}>
                              {title()}
                            </h2>
                          </Show>

                          <Show when={hasJsxContent(description())}>
                            <p
                              id={descriptionId()}
                              data-slot="description"
                              {...resolved.styles.description}
                            >
                              {description()}
                            </p>
                          </Show>
                        </div>

                        <Show when={hasJsxContent(action())}>
                          <div data-slot="actions" {...resolved.styles.actions}>
                            {action()}
                          </div>
                        </Show>

                        <Show when={closeContent() !== false}>
                          <Modal.Close
                            data-slot="close"
                            aria-label="Close"
                            {...resolved.styles.close}
                          >
                            <Show when={closeContent() === true} fallback={closeContent()}>
                              <Icon name="icon-close" />
                            </Show>
                          </Modal.Close>
                        </Show>
                      </>
                    }
                  >
                    {header()}
                  </Show>
                </div>
              </Show>

              <Show when={hasJsxContent(body())}>
                <div
                  data-slot="body"
                  data-header={hasCustomHeader() || hasDefaultHeader() ? '' : undefined}
                  {...resolved.styles.body}
                >
                  {body()}
                </div>
              </Show>

              <Show when={hasJsxContent(footer())}>
                <div data-slot="footer" {...resolved.styles.footer}>
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
