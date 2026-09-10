import type { JSX, ValidComponent } from 'solid-js'
import {
  Show,
  children as resolveChildren,
  createComponent,
  mergeProps,
  splitProps,
} from 'solid-js'

import { Icon } from '../../elements/icon'
import { createLazyMemo } from '../../shared/create-lazy-memo'
import { hasJsxContent } from '../../shared/jsx-content'
import { createComponentStyles } from '../../shared/provider'
import { Modal } from '../modal/modal'
import { ModalSurface } from '../modal/modal-content'
import { useModalContext } from '../modal/modal-context'

import type { SheetProps, SheetT } from './sheet.types'

/** Sheet state and context. Trigger, Content, and Close own their respective DOM. */
export function Sheet(props: SheetProps): JSX.Element {
  return <Modal {...props} />
}

function SheetTrigger<T extends ValidComponent = 'button'>(
  props: SheetT.TriggerProps<T>,
): JSX.Element {
  const resolved = createComponentStyles('sheet', props, { rootSlot: 'trigger' })
  const partProps = mergeProps(props, resolved.root) as SheetT.TriggerProps<T>
  return createComponent(Modal.Trigger<T>, partProps)
}

function SheetClose<T extends ValidComponent = 'button'>(props: SheetT.CloseProps<T>): JSX.Element {
  const resolved = createComponentStyles('sheet', props, { rootSlot: 'close' })
  const partProps = mergeProps(props, resolved.root) as SheetT.CloseProps<T>
  return createComponent(Modal.Close<T>, partProps)
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

  const resolved = createComponentStyles('sheet', local, { rootSlot: 'content' })

  return (
    <ModalSurface
      {...rest}
      data-transition={merged.transition ? '' : undefined}
      overlay={merged.overlay}
      overlayClass={resolved.slot('overlay').class}
      overlayStyle={resolved.slot('overlay').style}
      class={resolved.slot('content').class}
      style={resolved.slot('content').style}
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
        const hasCustomHeader = createLazyMemo(() => hasJsxContent(header()))
        const titleId = createLazyMemo(() =>
          !hasCustomHeader() && hasJsxContent(title()) ? `${context.contentId()}-title` : undefined,
        )
        const descriptionId = createLazyMemo(() =>
          !hasCustomHeader() && hasJsxContent(description())
            ? `${context.contentId()}-description`
            : undefined,
        )
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
                <div data-slot="header" {...resolved.slot('header')}>
                  <Show
                    when={hasCustomHeader()}
                    fallback={
                      <>
                        <div data-slot="wrapper" {...resolved.slot('wrapper')}>
                          <Show when={hasJsxContent(title())}>
                            <h2 id={titleId()} data-slot="title" {...resolved.slot('title')}>
                              {title()}
                            </h2>
                          </Show>

                          <Show when={hasJsxContent(description())}>
                            <p
                              id={descriptionId()}
                              data-slot="description"
                              {...resolved.slot('description')}
                            >
                              {description()}
                            </p>
                          </Show>
                        </div>

                        <Show when={hasJsxContent(action())}>
                          <div data-slot="actions" {...resolved.slot('actions')}>
                            {action()}
                          </div>
                        </Show>

                        <Show when={closeContent() !== false}>
                          <Modal.Close
                            data-slot="close"
                            aria-label="Close"
                            {...resolved.slot('close')}
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
                  {...resolved.slot('body')}
                >
                  {body()}
                </div>
              </Show>

              <Show when={hasJsxContent(footer())}>
                <div data-slot="footer" {...resolved.slot('footer')}>
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
