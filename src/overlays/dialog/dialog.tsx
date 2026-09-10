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

import type { DialogProps, DialogT } from './dialog.types'

/** Dialog state and context. Trigger, Content, and Close own their respective DOM. */
export function Dialog(props: DialogProps): JSX.Element {
  return <Modal {...props} />
}

function DialogTrigger<T extends ValidComponent = 'button'>(
  props: DialogT.TriggerProps<T>,
): JSX.Element {
  const resolved = createComponentStyles('dialog', props, { rootSlot: 'trigger' })
  const partProps = mergeProps(props, resolved.root) as DialogT.TriggerProps<T>
  return createComponent(Modal.Trigger<T>, partProps)
}

function DialogClose<T extends ValidComponent = 'button'>(
  props: DialogT.CloseProps<T>,
): JSX.Element {
  const resolved = createComponentStyles('dialog', props, { rootSlot: 'close' })
  const partProps = mergeProps(props, resolved.root) as DialogT.CloseProps<T>
  return createComponent(Modal.Close<T>, partProps)
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
  const merged = mergeProps(
    { overlay: true, close: true, closeIcon: 'icon-close' as const },

    local,
  )
  const resolved = createComponentStyles('dialog', local, { rootSlot: 'content' })
  const overlayScroll = () =>
    Boolean(resolved.variants.scrollable && merged.overlay && !resolved.variants.fullscreen)

  return (
    <ModalSurface
      {...rest}
      overlay={merged.overlay}
      overlayScroll={overlayScroll()}
      overlayClass={resolved.slot('overlay').class}
      overlayStyle={resolved.slot('overlay').style}
      {...resolved.root}
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
          hasCustomHeader() ||
          hasJsxContent(title()) ||
          hasJsxContent(description()) ||
          merged.close

        return {
          ariaLabel: merged.ariaLabel,
          ariaLabelledBy: titleId(),
          ariaDescribedBy: descriptionId(),
          children: () => (
            <>
              <Show when={hasHeader()}>
                <div data-slot="header" {...resolved.slot('header')}>
                  <Show
                    when={hasCustomHeader()}
                    fallback={
                      <>
                        <Show when={hasJsxContent(title()) || hasJsxContent(description())}>
                          <div
                            data-slot="wrapper"
                            data-close={merged.close ? '' : undefined}
                            {...resolved.slot('wrapper')}
                          >
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
                        </Show>
                        <Show when={merged.close}>
                          <Modal.Close aria-label="Close" {...resolved.slot('close')}>
                            <Icon name={closeIcon()} />
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
                  data-scroll={overlayScroll() ? undefined : ''}
                  data-header={hasHeader() ? '' : undefined}
                  data-footer={hasJsxContent(footer()) ? '' : undefined}
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

Dialog.Trigger = DialogTrigger
Dialog.Content = DialogContent
Dialog.Close = DialogClose
