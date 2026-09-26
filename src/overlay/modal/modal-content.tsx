import type { Accessor, JSX } from 'solid-js'
import { Show, children as resolveChildren, onCleanup, splitProps } from 'solid-js'

import { createStyles } from '../../provider'
import { useCn } from '../../provider/cn-context'
import { renderComponentOrElement } from '../../shared/render-prop'
import { callHandler, callRef } from '../../shared/utils'
import { trapFocusInContainer } from '../base/utils'

import { useModalContext } from './modal-context'
import { modalDataAttributes, modalRecipe } from './modal.recipe'
import type { ModalT } from './modal.types'

export type ModalSurfaceProps = ModalT.ContentProps & {
  /** Internal overlay support for composed overlays (Dialog, Sheet). */
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
    'trapFocus',
  ])
  const context = useModalContext()
  const overlayScroll = () => Boolean(local.overlayScroll && local.overlay)
  const presence = context.presence
  // oxlint-disable-next-line subf/solid-reactivity -- The accessor is stored and read from overlay event handlers so each interaction observes the current prop.
  onCleanup(context.registerContent(() => local.trapFocus !== false))
  const body = resolveChildren(() =>
    renderComponentOrElement(local.children, {
      close: () => context.updateOpen(false),
    }),
  )

  const renderOverlay = (content?: JSX.Element): JSX.Element => (
    <div
      data-slot={context.slotName('overlay')}
      {...modalDataAttributes.overlay({
        overlayScroll,
        expanded: () => presence.dataAttrs()['data-expanded'],
        closed: () => presence.dataAttrs()['data-closed'],
      })}
      ref={(element) => {
        onCleanup(presence.registerElement(element))
      }}
      class={cn(local.overlayClass)}
      style={local.overlayStyle}
    >
      {content}
    </div>
  )

  const renderContent = (body: Accessor<JSX.Element>): JSX.Element => (
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
        if (local.trapFocus !== false) {
          trapFocusInContainer(event, context.contentElement())
        }
      }}
    >
      {body()}
    </div>
  )

  return (
    <Show
      when={overlayScroll()}
      fallback={
        <>
          <Show when={local.overlay}>{(_value) => renderOverlay()}</Show>
          {renderContent(body)}
        </>
      }
    >
      {(_value) => renderOverlay(renderContent(body))}
    </Show>
  )
}
