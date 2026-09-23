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
import { modalDataAttributes, modalRecipe } from './modal.recipe'
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
  const [local, rest] = splitProps(props, ['class', 'style'])

  const context = useModalContext()
  const resolved = createStyles(modalRecipe, local, {
    rootSlot: 'content',
    inheritedStyles: () => context.presentation,
  })
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
  const nativeAriaLabel = () => rest['aria-label']
  const nativeAriaLabelledBy = () => rest['aria-labelledby']
  const nativeAriaDescribedBy = () => rest['aria-describedby']
  const ariaLabel = (surface?: SurfaceContent) =>
    nativeAriaLabel() ?? surface?.ariaLabel ?? local.ariaLabel
  const ariaLabelledBy = (surface?: SurfaceContent) => {
    const explicitLabel = ariaLabel(surface)
    const explicitLabelledBy = nativeAriaLabelledBy() ?? local.ariaLabelledBy

    return explicitLabelledBy ?? (explicitLabel === undefined ? surface?.ariaLabelledBy : undefined)
  }
  const ariaDescribedBy = (surface?: SurfaceContent) =>
    nativeAriaDescribedBy() ?? surface?.ariaDescribedBy ?? local.ariaDescribedBy

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
      data-slot={context.slotName('overlay')}
      {...modalDataAttributes.overlay({
        overlayScroll,
        expanded: () => presence.dataAttrs()['data-expanded'],
        closed: () => presence.dataAttrs()['data-closed'],
      })}
      ref={(element) => {
        const unregister = presence.registerElement(element)
        local.overlayRef?.(element)
        onCleanup(() => {
          unregister()
          local.overlayRef?.(undefined)
        })
      }}
      class={cn(local.overlayClass)}
      style={local.overlayStyle}
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
        {...modalDataAttributes.content({
          expanded: () => presence.dataAttrs()['data-expanded'],
          closed: () => presence.dataAttrs()['data-closed'],
        })}
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
        aria-modal={context.isModal() ? 'true' : undefined}
        aria-label={ariaLabel(surface)}
        aria-labelledby={ariaLabelledBy(surface)}
        aria-describedby={ariaDescribedBy(surface)}
        tabIndex={-1}
        data-slot={context.slotName('content')}
        class={cn(local.class)}
        style={local.style}
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
