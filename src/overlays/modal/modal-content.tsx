import type { JSX } from 'solid-js'
import { Show, children as resolveChildren, createMemo, onCleanup, splitProps } from 'solid-js'
import { Portal } from 'solid-js/web'

import { createComponentStyles } from '../../shared/provider'
import { useCn } from '../../shared/provider/cn-context'
import { renderComponentOrElement } from '../../shared/render-prop'
import { callHandler, callRef } from '../../shared/utils'
import { trapFocusInContainer } from '../base/utils'

import { useModalContext } from './modal-context'
import type { ModalT } from './modal.types'

type SurfaceContent = Pick<
  ModalT.ContentBase,
  'ariaDescribedBy' | 'ariaLabel' | 'ariaLabelledBy' | 'children'
>
type ModalSurfaceProps = Omit<ModalT.ContentProps, 'children'> & {
  children?: ModalT.ContentBase['children']
  surfaceRender?: () => SurfaceContent
}

/** Standalone Modal presentation; composed overlays use the same unstyled surface. */
export function ModalContent(props: ModalT.ContentProps): JSX.Element {
  const cn = useCn()
  const [local, rest] = splitProps(props, [
    'class',
    'style',
    'classes',
    'styles',
    'overlayClass',
    'overlayStyle',
  ])

  const resolved = createComponentStyles('modal', local, { rootSlot: 'content' })
  return (
    <ModalSurface
      {...rest}
      {...resolved.root}
      overlayClass={cn(resolved.slot('overlay').class, local.overlayClass)}
      overlayStyle={{ ...resolved.slot('overlay').style, ...local.overlayStyle }}
    />
  )
}

/** Shared modal DOM, presence, and focus behavior without a default visual layer. */
export function ModalSurface(props: ModalSurfaceProps): JSX.Element {
  const cn = useCn()
  type RuntimeProps = ModalT.ContentBase & {
    surfaceRender?: () => SurfaceContent
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
    'surfaceRender',
  ])
  const context = useModalContext()
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

  const renderContent = (surface?: SurfaceContent): JSX.Element => {
    const body = resolveChildren(() => (surface?.children ?? local.children) as JSX.Element)

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
        {renderComponentOrElement(body() as ModalT.ContentBase['children'], {
          close: () => context.updateOpen(false),
        })}
      </div>
    )
  }

  return (
    <Show when={presence.present()}>
      {(_present) => {
        const surface = local.surfaceRender?.()

        return (
          <Portal>
            <Show when={overlayScroll()}>{(_value) => renderOverlay(renderContent(surface))}</Show>
            <Show when={renderOutsideOverlay()}>
              {(_value) => (
                <>
                  <Show when={hasOverlay()}>{(_value) => renderOverlay()}</Show>
                  {renderContent(surface)}
                </>
              )}
            </Show>
          </Portal>
        )
      }}
    </Show>
  )
}
