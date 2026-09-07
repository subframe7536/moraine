import type { JSX, ValidComponent } from 'solid-js'
import {
  Show,
  children as resolveChildren,
  createComponent,
  mergeProps,
  splitProps,
} from 'solid-js'

import { Icon } from '../../elements/icon/index.ts'
import { createLazyMemo } from '../../shared/create-lazy-memo.ts'
import { hasJsxContent } from '../../shared/jsx-content.ts'
import { resolveComponentStyle, useMoraineDesign } from '../../shared/provider/index.ts'
import { ModalSurface } from '../modal/modal-content.tsx'
import { useModalContext } from '../modal/modal-context.ts'
import { Modal } from '../modal/modal.tsx'

import type { DialogProps, DialogT } from './dialog.types.ts'

export type { DialogProps, DialogT } from './dialog.types.ts'

/** Dialog state and context. Trigger, Content, and Close own their respective DOM. */
export function Dialog(props: DialogProps): JSX.Element {
  return <Modal {...props} />
}

function DialogTrigger<T extends ValidComponent = 'button'>(
  props: DialogT.TriggerProps<T>,
): JSX.Element {
  const design = useMoraineDesign()
  const resolved = resolveComponentStyle({
    rootSlot: 'trigger',
    design: {
      get classes() {
        return design().dialog.recipe()
      },
    },
    get instance() {
      return props
    },
  })
  const partProps = mergeProps(props, resolved.rootClassAndStyle()) as DialogT.TriggerProps<T>
  return createComponent(Modal.Trigger<T>, partProps)
}

function DialogClose<T extends ValidComponent = 'button'>(
  props: DialogT.CloseProps<T>,
): JSX.Element {
  const design = useMoraineDesign()
  const resolved = resolveComponentStyle({
    rootSlot: 'close',
    design: {
      get classes() {
        return design().dialog.recipe()
      },
    },
    get instance() {
      return props
    },
  })
  const partProps = mergeProps(props, resolved.rootClassAndStyle()) as DialogT.CloseProps<T>
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
  const design = useMoraineDesign()
  const context = useModalContext()
  const merged = mergeProps(
    { overlay: true, close: true, closeIcon: 'icon-close' as const },
    () => design().dialog.defaultVariants,
    local,
  )
  const overlayScroll = () => Boolean(merged.scrollable && merged.overlay && !merged.fullscreen)
  const resolved = resolveComponentStyle({
    rootSlot: 'content',
    design: {
      get classes() {
        return design().dialog.recipe({
          fullscreen: merged.fullscreen,
          scrollable: overlayScroll(),
        })
      },
    },
    get instance() {
      return local
    },
  })
  const title = createLazyMemo(() => merged.title)
  const description = createLazyMemo(() => merged.description)
  const header = createLazyMemo(() => merged.header)
  const body = createLazyMemo(() => {
    const explicitBody = merged.body
    return explicitBody === undefined ? resolveChildren(() => merged.children)() : explicitBody
  })
  const footer = createLazyMemo(() => merged.footer)
  const closeIcon = createLazyMemo(() => merged.closeIcon)
  const hasCustomHeader = createLazyMemo(() => hasJsxContent(header()))
  const titleId = createLazyMemo(() =>
    !hasCustomHeader() && hasJsxContent(title()) ? `${context.contentId()}-title` : undefined,
  )
  const descriptionId = createLazyMemo(() =>
    !hasCustomHeader() && hasJsxContent(description())
      ? `${context.contentId()}-description`
      : undefined,
  )
  const hasHeader = () =>
    hasCustomHeader() || hasJsxContent(title()) || hasJsxContent(description()) || merged.close

  return (
    <ModalSurface
      {...rest}
      overlay={merged.overlay}
      overlayScroll={overlayScroll()}
      overlayClass={resolved.slotClass('overlay')}
      overlayStyle={resolved.slotStyle('overlay')}
      {...resolved.rootClassAndStyle()}
      ariaLabel={merged.ariaLabel}
      ariaLabelledBy={titleId()}
      ariaDescribedBy={descriptionId()}
    >
      {() => (
        <>
          <Show when={hasHeader()}>
            <div data-slot="header" {...resolved.slotClassAndStyle('header')}>
              <Show
                when={hasCustomHeader()}
                fallback={
                  <>
                    <Show when={hasJsxContent(title()) || hasJsxContent(description())}>
                      <div
                        data-slot="wrapper"
                        data-close={merged.close ? '' : undefined}
                        {...resolved.slotClassAndStyle('wrapper')}
                      >
                        <Show when={hasJsxContent(title())}>
                          <h2
                            id={titleId()}
                            data-slot="title"
                            {...resolved.slotClassAndStyle('title')}
                          >
                            {title()}
                          </h2>
                        </Show>
                        <Show when={hasJsxContent(description())}>
                          <p
                            id={descriptionId()}
                            data-slot="description"
                            {...resolved.slotClassAndStyle('description')}
                          >
                            {description()}
                          </p>
                        </Show>
                      </div>
                    </Show>
                    <Show when={merged.close}>
                      <Modal.Close aria-label="Close" {...resolved.slotClassAndStyle('close')}>
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
              {...resolved.slotClassAndStyle('body')}
            >
              {body()}
            </div>
          </Show>
          <Show when={hasJsxContent(footer())}>
            <div data-slot="footer" {...resolved.slotClassAndStyle('footer')}>
              {footer()}
            </div>
          </Show>
        </>
      )}
    </ModalSurface>
  )
}

Dialog.Trigger = DialogTrigger
Dialog.Content = DialogContent
Dialog.Close = DialogClose
