import type { JSX } from 'solid-js'
import { Show, children as resolveChildren, createMemo, onCleanup, splitProps } from 'solid-js'
import { Portal } from 'solid-js/web'

import { createLazyMemo } from '../../shared/create-lazy-memo.ts'
import { resolveComponentStyle, useMoraineDesign } from '../../shared/provider/index.ts'
import { renderComponentOrElement } from '../../shared/render-prop.ts'
import { callHandler, callRef, cn } from '../../shared/utils.ts'
import { trapFocusInContainer } from '../base/utils.ts'

import { useModalContext } from './modal-context.ts'
import type { ModalT } from './modal.types.ts'

/** Standalone Modal presentation; composed overlays use the same unstyled surface. */
export function ModalContent(props: ModalT.ContentProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    'class',
    'style',
    'classes',
    'styles',
    'overlayClass',
    'overlayStyle',
  ])
  const design = useMoraineDesign()
  const resolved = resolveComponentStyle({
    rootSlot: 'content',
    design: {
      get classes() {
        return design().modal.recipe()
      },
    },
    get instance() {
      return {
        class: local.class,
        style: local.style,
        classes: { ...local.classes, overlay: cn(local.classes?.overlay, local.overlayClass) },
        styles: { ...local.styles, overlay: { ...local.styles?.overlay, ...local.overlayStyle } },
      }
    },
  })
  return (
    <ModalSurface
      {...rest}
      {...resolved.rootClassAndStyle()}
      overlayClass={resolved.slotClass('overlay')}
      overlayStyle={resolved.slotStyle('overlay')}
    />
  )
}

/** Shared modal DOM, presence, and focus behavior without a default visual layer. */
export function ModalSurface(props: ModalT.ContentProps): JSX.Element {
  type RuntimeProps = ModalT.ContentBase & {
    class?: ModalT.Classes['content']
    style?: JSX.CSSProperties
    classes?: Partial<ModalT.Classes>
    styles?: Partial<ModalT.Styles>
    ref?: (element: HTMLDivElement | undefined) => void
    onKeyDown?: JSX.EventHandlerUnion<HTMLDivElement, KeyboardEvent>
  } & Record<string, unknown>

  const [local, rest] = splitProps(props as RuntimeProps, [
    'ref',
    'overlay',
    'overlayScroll',
    'overlayRef',
    'overlayClass',
    'overlayStyle',
    'children',
    'ariaLabel',
    'ariaLabelledBy',
    'ariaDescribedBy',
    'class',
    'style',
    'classes',
    'styles',
    'onKeyDown',
  ])
  const context = useModalContext()
  const children = createLazyMemo(() => local.children)
  const overlayScroll = createMemo(() => Boolean(local.overlayScroll && local.overlay))
  const renderOutsideOverlay = createMemo(() => !overlayScroll())
  const hasOverlay = createMemo(() => Boolean(props.overlay))
  const presence = context.presence
  const unregisterContent = context.registerContent()
  onCleanup(unregisterContent)

  const onContentKeyDown = (event: KeyboardEvent): void => {
    callHandler(event, local.onKeyDown)
    if (event.defaultPrevented) {
      return
    }
    trapFocusInContainer(event, context.contentElement())
  }

  const renderOverlay = (content?: JSX.Element): JSX.Element => (
    <div
      data-slot="overlay"
      data-overlay-scroll={overlayScroll() ? '' : undefined}
      {...presence.dataAttrs()}
      ref={(element) => {
        const unregister = presence.registerElement(element)
        local.overlayRef?.(element)
        onCleanup(() => {
          unregister()
          local.overlayRef?.(undefined)
        })
      }}
      class={cn(local.overlayClass, local.classes?.overlay)}
      style={{ ...local.styles?.overlay, ...local.overlayStyle }}
    >
      {content}
    </div>
  )

  const renderContent = (): JSX.Element => (
    <div
      {...rest}
      {...presence.dataAttrs()}
      ref={(element) => {
        const unregister = presence.registerElement(element)
        context.setContentElement(element)
        callRef(local.ref, element)
        onCleanup(() => {
          unregister()
          if (context.contentElement() === element) {
            context.setContentElement(undefined)
            callRef(local.ref, undefined)
          }
        })
      }}
      id={context.contentId()}
      role="dialog"
      aria-modal="true"
      aria-label={local.ariaLabel}
      aria-labelledby={local.ariaLabelledBy}
      aria-describedby={local.ariaDescribedBy}
      tabIndex={-1}
      data-slot="content"
      class={cn(local.classes?.content, local.class)}
      style={{ ...local.styles?.content, ...local.style }}
      onKeyDown={onContentKeyDown}
    >
      {(() => {
        const body = resolveChildren(() => children() as JSX.Element)
        return renderComponentOrElement(body() as ModalT.ContentBase['children'], {
          close: () => context.updateOpen(false),
        })
      })()}
    </div>
  )

  return (
    <Show when={presence.present()}>
      <Portal>
        <Show when={overlayScroll()}>{(_value) => renderOverlay(renderContent())}</Show>
        <Show when={renderOutsideOverlay()}>
          {(_value) => (
            <>
              <Show when={hasOverlay()}>{(_value) => renderOverlay()}</Show>
              {renderContent()}
            </>
          )}
        </Show>
      </Portal>
    </Show>
  )
}
