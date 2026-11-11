import type { JSX } from 'solid-js'
import { createSignal, onCleanup, splitProps } from 'solid-js'

import { callHandler, callRef, createId } from '../../shared/utils'
import { useRecipe } from '../../theme/use-recipe'

import { clamp, fixToPrecision } from './hook'
import {
  ResizablePanelProvider,
  useResizableContext,
  useResizablePanelContext,
} from './resizable-context'
import type { ResizableItem, ResizablePanelRegistration } from './resizable-context'
import { resizableDataAttributes, resizableRecipe } from './resizable.recipe'
import type { ResizableT } from './resizable.types'

/**
 * Imperative panel API. Only valid inside `Resizable.Panel` content; throws
 * when called outside a panel.
 */
export function useResizablePanel(): ResizableT.PanelContext {
  return useResizablePanelContext()
}

export function ResizablePanel(props: ResizableT.PanelProps): JSX.Element {
  const ctx = useResizableContext()
  const [local, rest] = splitProps(props, [
    'id',
    'min',
    'max',
    'resizable',
    'collapsible',
    'collapsedSize',
    'onCollapse',
    'onExpand',
    'children',
    'class',
    'style',
    'ref',
    'onTransitionEnd',
    'onTransitionCancel',
  ])

  const [element, setElement] = createSignal<HTMLElement>()
  const panelId = createId(() => local.id, 'resizable-panel')
  const min = () => clamp(local.min ?? 0, 0, 100)
  const max = () => Math.max(min(), clamp(local.max ?? 100, 0, 100))
  const collapsedSize = () => clamp(local.collapsedSize ?? 0, 0, min())

  const registration: ResizablePanelRegistration = {
    id: panelId,
    element,
    min,
    max,
    resizable: () => local.resizable !== false,
    collapsible: () => local.collapsible === true,
    collapsedSize,
    onCollapse: () => local.onCollapse?.(),
    onExpand: () => local.onExpand?.(),
  }
  const item: ResizableItem = { kind: 'panel', seq: 0, panel: registration }
  onCleanup(ctx.registerItem(item))

  const size = () => ctx.panelSize(registration)
  const collapsed = () => ctx.panelCollapsed(registration)
  const expanded = () => registration.collapsible() && !collapsed()

  const flexStyle = (): JSX.CSSProperties => {
    if (!ctx.settled()) {
      const basis = ctx.panelPreSettleBasis(registration)
      return basis === undefined
        ? { 'flex-grow': 1, 'flex-shrink': 1, 'flex-basis': '0%' }
        : { 'flex-grow': 0, 'flex-shrink': 1, 'flex-basis': `${basis}%` }
    }

    return {
      'flex-grow': 0,
      'flex-shrink': 1,
      'flex-basis': `${fixToPrecision(size() ?? 0)}%`,
    }
  }

  const {
    slots: { panel: panelSlot },
  } = useRecipe(resizableRecipe, local, {
    slot: 'panel',
    context: () => ({ variants: { orientation: ctx.orientation() }, ...ctx.slotOverrides }),
    enforced: { panel: () => ({ style: flexStyle() }) },
    data: {
      panel: resizableDataAttributes.panel({
        collapsed,
        expanded,
        resizing: ctx.resizing,
        transitioning: () => ctx.panelTransitioning(registration),
      }),
    },
  })

  const panelContext: ResizableT.PanelContext = {
    id: panelId(),
    size: () => size() ?? 0,
    collapsed,
    collapse: () => ctx.collapsePanel(panelId()),
    expand: () => ctx.expandPanel(panelId()),
    resize: (nextSize) => ctx.resizePanel(panelId(), nextSize),
  }

  return (
    <div
      data-slot="resizable-panel"
      {...panelSlot}
      {...rest}
      ref={(node) => {
        setElement(node)
        callRef(local.ref, node)
      }}
      id={panelId()}
      onTransitionEnd={(event) => {
        const result = callHandler(event, local.onTransitionEnd)
        if (
          !result.defaultPrevented &&
          event.propertyName === 'flex-basis' &&
          event.target === event.currentTarget
        ) {
          ctx.clearPanelTransition(panelId())
        }
      }}
      onTransitionCancel={(event) => {
        const result = callHandler(event, local.onTransitionCancel)
        if (!result.defaultPrevented && event.target === event.currentTarget) {
          ctx.clearPanelTransition(panelId())
        }
      }}
    >
      <ResizablePanelProvider value={panelContext}>{local.children}</ResizablePanelProvider>
    </div>
  )
}
