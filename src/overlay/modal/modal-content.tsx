import type { JSX } from 'solid-js'
import {
  Show,
  children as resolveChildren,
  createEffect,
  on,
  onCleanup,
  splitProps,
} from 'solid-js'

import { createStyles } from '../../provider'
import { useCn } from '../../provider/cn-context'
import { renderWithProps } from '../../shared/render-with-props'
import { callHandler, callRef } from '../../shared/utils'
import { containFocusInContainer } from '../base/utils'

import { useModalContext } from './modal-context'
import { modalDataAttributes, modalRecipe } from './modal.recipe'
import type { ModalT } from './modal.types'

export type ModalSurfaceProps = ModalT.ContentProps & {
  /** Internal overlay support for composed overlays (Dialog, Sheet). */
  composite?: boolean
  overlay?: boolean
  overlayScroll?: boolean
  overlayClass?: string
  overlayStyle?: JSX.CSSProperties
}

/** Standalone Modal presentation; composed overlays use the same recipe-backed surface. */
export function ModalContent(props: ModalT.ContentProps): JSX.Element {
  const [local, rest] = splitProps(props, ['class', 'style'])

  const context = useModalContext()
  return (
    <ModalSurface
      {...rest}
      {...createStyles(modalRecipe, local, {
        rootSlot: 'content',
        inheritedStyles: () => context.presentation,
      }).styles.content}
    />
  )
}

/** Shared modal DOM, focus, and recipe-backed presentation behavior. */
export function ModalSurface(props: ModalSurfaceProps): JSX.Element {
  const cn = useCn()
  const [local, rest] = splitProps(props, [
    'ref',
    'composite',
    'overlay',
    'overlayScroll',
    'overlayClass',
    'overlayStyle',
    'children',
    'ariaLabel',
    'ariaLabelledBy',
    'ariaDescribedBy',
    'class',
    'style',
    'onKeyDown',
  ])
  const context = useModalContext()
  const overlayScroll = () => Boolean(local.overlayScroll && local.overlay)
  createEffect(on(overlayScroll, context.setOverlayScroll))
  onCleanup(() => context.setOverlayScroll(false))
  const presence = context.presence
  const body = resolveChildren(() =>
    renderWithProps(local.children, {
      close: () => context.updateOpen(false),
    }),
  )

  const Overlay = (overlayProps: { children?: JSX.Element }): JSX.Element => (
    <div
      data-slot={local.overlay ? context.slotName('overlay') : undefined}
      {...modalDataAttributes.overlay({
        overlayScroll,
        expanded: () => presence.dataAttrs()['data-expanded'],
        closed: () => presence.dataAttrs()['data-closed'],
      })}
      ref={(element) => {
        onCleanup(presence.registerElement(element))
      }}
      class={local.overlay ? cn(local.overlayClass) : undefined}
      style={local.overlay ? local.overlayStyle : undefined}
    >
      {overlayProps.children}
    </div>
  )

  const Content = (): JSX.Element => (
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
      aria-label={rest['aria-label'] ?? local.ariaLabel}
      aria-labelledby={rest['aria-labelledby'] ?? local.ariaLabelledBy}
      aria-describedby={rest['aria-describedby'] ?? local.ariaDescribedBy}
      tabIndex={-1}
      data-slot={context.slotName('content')}
      class={cn(local.class)}
      style={local.style}
      onKeyDown={(event) => {
        callHandler(event, local.onKeyDown)
        if (event.defaultPrevented) {
          return
        }
        if (context.isModal()) {
          containFocusInContainer(event, context.contentElement())
        }
      }}
    >
      {body()}
    </div>
  )

  return (
    <Show
      when={local.composite}
      fallback={
        <>
          <Show when={local.overlay}>
            <Overlay />
          </Show>
          <Content />
        </>
      }
    >
      <Overlay>
        <Content />
      </Overlay>
    </Show>
  )
}
