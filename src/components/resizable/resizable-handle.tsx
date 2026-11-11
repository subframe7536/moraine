import type { JSX } from 'solid-js'
import {
  Show,
  children as resolveChildren,
  createMemo,
  createSignal,
  onCleanup,
  splitProps,
} from 'solid-js'

import { renderWithProps } from '../../shared/render-with-props'
import { callHandler, callRef } from '../../shared/utils'
import { useRecipe } from '../../theme/use-recipe'
import { createSplitterHandle } from '../shared/splitter'

import { fixToPrecision } from './hook'
import { useResizableContext } from './resizable-context'
import type {
  ResizableHandleRegistration,
  ResizableItem,
  ResizablePanelRegistration,
} from './resizable-context'
import { resizableDataAttributes, resizableRecipe } from './resizable.recipe'
import type { ResizableT } from './resizable.types'

function callHandleEvent<E extends Event>(
  event: E,
  handler: unknown,
  internal: (event: E) => void,
): void {
  const result = callHandler(event, handler)
  if (!result.defaultPrevented) {
    internal(event)
  }
}

export function ResizableHandle(props: ResizableT.HandleProps): JSX.Element {
  const ctx = useResizableContext()
  const [local, rest] = splitProps(props, [
    'intersection',
    'children',
    'class',
    'style',
    'ref',
    'onMouseEnter',
    'onMouseLeave',
    'onFocus',
    'onBlur',
    'onKeyDown',
    'onPointerDown',
  ])

  const [element, setElement] = createSignal<HTMLElement>()
  const content = resolveChildren(() => local.children as JSX.Element)

  const registration: ResizableHandleRegistration = { element }
  const item: ResizableItem = { kind: 'handle', seq: 0, handle: registration }
  onCleanup(ctx.registerItem(item))

  const neighbors = createMemo<{
    preceding: ResizablePanelRegistration | undefined
    following: ResizablePanelRegistration | undefined
    precedingIndex: number
  }>(() => {
    const list = ctx.orderedItems()
    const index = list.indexOf(item)
    let preceding: ResizablePanelRegistration | undefined
    let following: ResizablePanelRegistration | undefined

    if (index >= 0) {
      for (let i = index - 1; i >= 0; i -= 1) {
        const entry = list[i]!
        if (entry.kind === 'panel') {
          preceding = entry.panel
          break
        }
      }
      for (let i = index + 1; i < list.length; i += 1) {
        const entry = list[i]!
        if (entry.kind === 'panel') {
          following = entry.panel
          break
        }
      }
    }

    return {
      preceding,
      following,
      precedingIndex: preceding ? ctx.panelIndex(preceding) : -1,
    }
  })

  const preceding = () => neighbors().preceding
  const following = () => neighbors().following
  const precedingIndex = () => neighbors().precedingIndex

  const handleDisabled = createMemo(() => {
    if (ctx.disabled()) {
      return true
    }
    const before = preceding()
    const after = following()
    if (!before || !after) {
      // Before settle a missing neighbor may simply not be registered yet.
      return ctx.settled()
    }
    return !before.resizable() || !after.resizable()
  })

  const bindings = createSplitterHandle({
    orientation: ctx.orientation,
    disabled: handleDisabled,
    intersection: () => local.intersection,
    onDrag: (deltaPx, altKey) => ctx.dragHandle(precedingIndex(), deltaPx, altKey),
    onDragEnd: ctx.endHandleDrag,
    onKeyDown: (event) => ctx.handleKeyDown(precedingIndex(), event),
  })

  /** Collapse target for Enter toggles and `canCollapse`: preceding collapsible first. */
  const collapseTarget = createMemo(() => {
    const before = preceding()
    if (before?.collapsible()) {
      return before
    }
    const after = following()
    return after?.collapsible() ? after : undefined
  })

  const aria = createMemo(() => {
    const panel = preceding()
    if (!panel) {
      return {
        controls: undefined as string | undefined,
        valueNow: undefined as number | undefined,
        valueMin: undefined as number | undefined,
        valueMax: undefined as number | undefined,
      }
    }

    return {
      controls: panel.id(),
      valueNow: fixToPrecision(ctx.panelSize(panel) ?? 0),
      valueMin: fixToPrecision(panel.collapsible() ? panel.collapsedSize() : panel.min()),
      valueMax: fixToPrecision(panel.max()),
    }
  })

  const handleRenderProps: ResizableT.HandleRenderProps = {
    get orientation() {
      return ctx.orientation()
    },
    get disabled() {
      return handleDisabled()
    },
    get active() {
      return bindings.active()
    },
    get dragging() {
      return bindings.dragging()
    },
    get canCollapse() {
      return collapseTarget() !== undefined
    },
    get collapsed() {
      const target = collapseTarget()
      return target !== undefined && ctx.panelCollapsed(target)
    },
  }

  const {
    slots: { handle: handleSlot, grip: gripSlot },
    slotWith,
  } = useRecipe(resizableRecipe, local, {
    slot: 'handle',
    context: () => ({ variants: { orientation: ctx.orientation() }, ...ctx.slotOverrides }),
    data: {
      handle: resizableDataAttributes.handle({
        active: bindings.active,
        cross: bindings.crossHovered,
        dragging: bindings.dragging,
      }),
    },
  })

  const startIntersectionSlot = slotWith('intersection', {
    data: resizableDataAttributes.intersection({
      splitterStartTarget: true,
      splitterEndTarget: undefined,
    }),
  })
  const endIntersectionSlot = slotWith('intersection', {
    data: resizableDataAttributes.intersection({
      splitterStartTarget: undefined,
      splitterEndTarget: true,
    }),
  })

  return (
    <div
      data-slot="resizable-handle"
      {...handleSlot}
      {...rest}
      role="separator"
      aria-orientation={ctx.orientation()}
      aria-controls={aria().controls}
      aria-valuenow={aria().valueNow}
      aria-valuemin={aria().valueMin}
      aria-valuemax={aria().valueMax}
      aria-disabled={handleDisabled() ? 'true' : undefined}
      tabIndex={handleDisabled() ? -1 : 0}
      ref={(node) => {
        setElement(node)
        bindings.setElement(node)
        callRef(local.ref, node)
      }}
      onMouseEnter={(event) => callHandleEvent(event, local.onMouseEnter, bindings.onMouseEnter)}
      onMouseLeave={(event) => callHandleEvent(event, local.onMouseLeave, bindings.onMouseLeave)}
      onFocus={(event) => callHandleEvent(event, local.onFocus, bindings.onFocus)}
      onBlur={(event) => callHandleEvent(event, local.onBlur, bindings.onBlur)}
      onKeyDown={(event) => callHandleEvent(event, local.onKeyDown, bindings.onKeyDown)}
      onPointerDown={(event) => callHandleEvent(event, local.onPointerDown, bindings.onPointerDown)}
    >
      <Show when={bindings.startIntersectionVisible()}>
        <div
          data-slot="resizable-intersection"
          {...startIntersectionSlot}
          onMouseEnter={() => bindings.onIntersectionMouseEnter('start')}
          onMouseLeave={bindings.onIntersectionMouseLeave}
        />
      </Show>
      <Show when={content() !== false}>
        <div data-slot="resizable-grip" aria-hidden="true" {...gripSlot}>
          <Show when={content() !== undefined}>
            {renderWithProps(content(), handleRenderProps)}
          </Show>
        </div>
      </Show>
      <Show when={bindings.endIntersectionVisible()}>
        <div
          data-slot="resizable-intersection"
          {...endIntersectionSlot}
          onMouseEnter={() => bindings.onIntersectionMouseEnter('end')}
          onMouseLeave={bindings.onIntersectionMouseLeave}
        />
      </Show>
    </div>
  )
}
