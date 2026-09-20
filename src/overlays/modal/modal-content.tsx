import type { JSX } from 'solid-js'
import { Show, children as resolveChildren, createMemo, onCleanup, splitProps } from 'solid-js'
import { Portal } from 'solid-js/web'

import { createStyles } from '../../provider'
import { useCn } from '../../provider/cn-context'
import { renderComponentOrElement } from '../../shared/render-prop'
import { callHandler, callRef } from '../../shared/utils'
import { trapFocusInContainer } from '../base/utils'

import { useModalContext } from './modal-context'
import { useModalOverlayContext } from './modal-overlay'
import { modalRecipe } from './modal.recipe'
import type { ModalT } from './modal.types'

export type SurfaceContent = Pick<
  ModalT.ContentBase,
  'ariaDescribedBy' | 'ariaLabel' | 'ariaLabelledBy' | 'children'
>
export type ModalSurfaceProps = Omit<ModalT.ContentProps, 'children'> & {
  children?: ModalT.ContentBase['children']
  surfaceRender?: () => SurfaceContent
  /** Internal overlay support for composed overlays (Dialog, Sheet). */
  overlay?: boolean
  overlayScroll?: boolean
  overlayRef?: (element: HTMLDivElement | undefined) => void
  overlayClass?: string
  overlayStyle?: JSX.CSSProperties
}

/** Standalone Modal presentation; composed overlays use the same recipe-backed surface. */
export function ModalContent(props: ModalT.ContentProps): JSX.Element {
  const [local, rest] = splitProps(props, ['class', 'style', 'classes', 'styles'])

  const resolved = createStyles(modalRecipe, local, { rootSlot: 'content' })
  return <ModalSurface {...rest} {...resolved.styles.content} />
}

/** Shared modal DOM, presence, focus, and recipe-backed presentation behavior. */
export function ModalSurface(props: ModalSurfaceProps): JSX.Element {
  const cn = useCn()
  const [local, rest] = splitProps(props, [
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
    'surfaceRender',
    'trapFocus',
  ])
  const context = useModalContext()
  const isInsideOverlay = useModalOverlayContext()
  const overlayScroll = createMemo(() => Boolean(local.overlayScroll && local.overlay))
  const renderOutsideOverlay = createMemo(() => !overlayScroll())
  const hasOverlay = createMemo(() => Boolean(props.overlay))
  const presence = context.presence
  // oxlint-disable-next-line subf/solid-reactivity -- The accessor is stored and read from overlay event handlers so each interaction observes the current prop.
  const unregisterContent = context.registerContent(() => local.trapFocus !== false)
  onCleanup(unregisterContent)

  const onContentKeyDown = (event: KeyboardEvent): void => {
    callHandler(event, local.onKeyDown)
    if (event.defaultPrevented) {
      return
    }
    if (local.trapFocus !== false) {
      trapFocusInContainer(event, context.contentElement())
    }
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

  const renderContent = (surface?: SurfaceContent): JSX.Element => {
    const body = resolveChildren(() =>
      renderComponentOrElement(surface?.children ?? local.children, {
        close: () => context.updateOpen(false),
      }),
    )

    return (
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
        aria-label={surface?.ariaLabel ?? local.ariaLabel}
        aria-labelledby={surface?.ariaLabelledBy ?? local.ariaLabelledBy}
        aria-describedby={surface?.ariaDescribedBy ?? local.ariaDescribedBy}
        tabIndex={-1}
        data-slot="content"
        class={cn(local.classes?.content, local.class)}
        style={{ ...local.styles?.content, ...local.style }}
        onKeyDown={onContentKeyDown}
      >
        {body()}
      </div>
    )
  }

  return (
    <Show when={presence.present()}>
      {(_present) => {
        const surface = local.surfaceRender?.()

        return (
          <Show
            when={isInsideOverlay}
            fallback={
              <Portal mount={context.triggerElement()?.ownerDocument.body}>
                <Show when={overlayScroll()}>
                  {(_value) => renderOverlay(renderContent(surface))}
                </Show>
                <Show when={renderOutsideOverlay()}>
                  {(_value) => (
                    <>
                      <Show when={hasOverlay()}>{(_value) => renderOverlay()}</Show>
                      {renderContent(surface)}
                    </>
                  )}
                </Show>
              </Portal>
            }
          >
            {renderContent(surface)}
          </Show>
        )
      }}
    </Show>
  )
}
