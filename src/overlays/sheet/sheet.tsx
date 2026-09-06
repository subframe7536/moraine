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

import type { SheetProps, SheetT } from './sheet.types.ts'

export type { SheetProps, SheetT } from './sheet.types.ts'

/** Sheet state and context. Trigger, Content, and Close own their respective DOM. */
export function Sheet(props: SheetProps): JSX.Element {
  return <Modal {...props} />
}

function SheetTrigger<T extends ValidComponent = 'button'>(
  props: SheetT.TriggerProps<T>,
): JSX.Element {
  const design = useMoraineDesign()
  const resolved = resolveComponentStyle({
    rootSlot: 'trigger',
    design: {
      get classes() {
        return design().sheet.recipe()
      },
    },
    get instance() {
      return props
    },
  })
  const partProps = mergeProps(props, resolved.rootClassAndStyle()) as SheetT.TriggerProps<T>
  return createComponent(Modal.Trigger<T>, partProps)
}

function SheetClose<T extends ValidComponent = 'button'>(props: SheetT.CloseProps<T>): JSX.Element {
  const design = useMoraineDesign()
  const resolved = resolveComponentStyle({
    rootSlot: 'close',
    design: {
      get classes() {
        return design().sheet.recipe()
      },
    },
    get instance() {
      return props
    },
  })
  const partProps = mergeProps(props, resolved.rootClassAndStyle()) as SheetT.CloseProps<T>
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
  const design = useMoraineDesign()
  const context = useModalContext()

  const merged = mergeProps(
    {
      overlay: true,
      transition: true,
      side: 'right' as const,
      inset: false,
      close: true,
    },
    () => design().sheet.defaultVariants,
    local,
  )

  const resolved = resolveComponentStyle({
    rootSlot: 'content',
    design: {
      get classes() {
        return design().sheet.recipe({ side: merged.side, inset: merged.inset })
      },
    },
    get instance() {
      return local
    },
  })

  const title = createLazyMemo(() => merged.title)
  const description = createLazyMemo(() => merged.description)
  const header = createLazyMemo(() => merged.header)
  const action = createLazyMemo(() => merged.action)
  const closeContent = createLazyMemo(() => merged.close)
  const body = createLazyMemo(() => {
    const explicitBody = merged.body
    return explicitBody === undefined ? resolveChildren(() => merged.children)() : explicitBody
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

  return (
    <ModalSurface
      {...rest}
      data-transition={merged.transition ? undefined : 'false'}
      overlay={merged.overlay}
      overlayClass={resolved.slotClass('overlay')}
      overlayStyle={resolved.slotStyle('overlay')}
      data-side={merged.side}
      ariaLabel={merged.ariaLabel}
      ariaLabelledBy={titleId()}
      ariaDescribedBy={descriptionId()}
      class={resolved.slotClass('content')}
      style={resolved.slotStyle('content')}
    >
      {(): JSX.Element => (
        <>
          <Show when={hasCustomHeader() || hasDefaultHeader()}>
            <div data-slot="header" {...resolved.slotClassAndStyle('header')}>
              <Show
                when={hasCustomHeader()}
                fallback={
                  <>
                    <div data-slot="wrapper" {...resolved.slotClassAndStyle('wrapper')}>
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

                    <Show when={hasJsxContent(action())}>
                      <div data-slot="actions" {...resolved.slotClassAndStyle('actions')}>
                        {action()}
                      </div>
                    </Show>

                    <Show when={closeContent() !== false}>
                      <Modal.Close
                        data-slot="close"
                        aria-label="Close"
                        {...resolved.slotClassAndStyle('close')}
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

Sheet.Trigger = SheetTrigger
Sheet.Content = SheetContent
Sheet.Close = SheetClose
