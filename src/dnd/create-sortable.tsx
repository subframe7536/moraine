import { DragDropProvider } from '@dnd-kit/solid'
import type { DragDropProviderProps } from '@dnd-kit/solid'
import { isSortable, useSortable } from '@dnd-kit/solid/sortable'
import type { FlowComponent } from 'solid-js'
import { createRenderEffect, createSignal, on, onCleanup, untrack } from 'solid-js'
import { isServer } from 'solid-js/web'

import { createDataAttributes } from '../theme/style-contract'

import type {
  Sortable,
  SortableDragState,
  SortableDropPosition,
  SortableDropTarget,
  SortableId,
  SortableItem,
  SortableItemAttributes,
  SortableItemInput,
  SortableVirtualRange,
} from './sortable.types'

export interface SortableOptions {
  /**
   * Input sensors. Pass an array to replace the defaults (pointer and keyboard) or a function
   * to extend them.
   */
  sensors?: DragDropProviderProps['sensors']
  /**
   * Drag and drop plugins. Pass an array to replace the defaults (accessibility announcements,
   * auto-scroll, cursor, drag feedback, and text selection prevention) or a function to extend them.
   */
  plugins?: DragDropProviderProps['plugins']
  /** Modifiers applied to every drag, such as axis or container restrictions. */
  modifiers?: DragDropProviderProps['modifiers']
  /** Rejects a drop location; rejected targets show no indicator and do not drop. */
  canDrop?: (target: SortableDropTarget) => boolean
  /**
   * Called once when a drag ends on an accepted target. Not called for canceled drags. Return the
   * id the source has after the move when it differs from `sourceId`, so the drop animation finds
   * its element.
   */
  onDrop?: (target: SortableDropTarget) => SortableId | void
  /**
   * Animates the source from where it was released to its place after the drop or cancel. Pass
   * `false` to place it at once.
   * @default { duration: 200, easing: 'cubic-bezier(0.25, 1, 0.5, 1)' }
   */
  dropAnimation?: false | { duration?: number; easing?: string }
}

type DragDropManager = Parameters<NonNullable<DragDropProviderProps['onDragMove']>>[1]
type DragOperation = Parameters<NonNullable<DragDropProviderProps['onDragEnd']>>[0]['operation']
type Point = { x: number; y: number }
type Rect = { top: number; left: number }

const DRAGGING_ATTRIBUTE = 'data-dnd-dragging'
const MAX_SETTLE_FRAMES = 10

function prefersReducedMotion(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
}

type PluginList = Exclude<
  NonNullable<DragDropProviderProps['plugins']>,
  (...args: never[]) => unknown
>

/**
 * Configures dnd kit's `Feedback` plugin. With `clone`, the item stays in place as a copy while the
 * item element follows the pointer, marked `data-dnd-dragging`; the copy is
 * `data-dnd-placeholder`. Its drop animation is off: it aims at the copy, which is gone or in the
 * wrong place once the host renders the move, so the sortable animates the moved element instead.
 * `Feedback` is the only default plugin with an `overlay` accessor; `@dnd-kit/solid` does not
 * export the class to compare against.
 */
function configureFeedback(plugins: PluginList): PluginList {
  return plugins.map((plugin) =>
    typeof plugin === 'function' && 'overlay' in plugin.prototype
      ? (
          plugin as unknown as {
            configure: (options: Record<string, unknown>) => PluginList[number]
          }
        ).configure({ feedback: 'clone', dropAnimation: null })
      : plugin,
  )
}

interface ItemData extends Record<string, unknown> {
  positions: readonly SortableDropPosition[]
}

const DEFAULT_POSITIONS: readonly SortableDropPosition[] = ['before', 'after']

const itemDataAttributes = /* @__PURE__ */ createDataAttributes('dragging', 'drop-position')

/** Picks a drop position from where the source sits along the target, from 0 (start) to 1 (end). */
function pickPosition(
  ratio: number,
  positions: readonly SortableDropPosition[],
): SortableDropPosition | undefined {
  const before = positions.includes('before')
  const after = positions.includes('after')
  if (positions.includes('inside')) {
    if (before && ratio < 0.25) {
      return 'before'
    }
    if (after && ratio > 0.75) {
      return 'after'
    }
    return 'inside'
  }
  if (before && (ratio < 0.5 || !after)) {
    return 'before'
  }
  return after ? 'after' : undefined
}

function isKeyboardDrag(event: Event | null): boolean {
  return typeof KeyboardEvent !== 'undefined' && event instanceof KeyboardEvent
}

/** Reads the drop location from a drag operation, optionally at a pointer position it has not applied yet. */
function readDragState(
  operation: DragOperation,
  point: Point = operation.position.current,
): SortableDragState | undefined {
  const { activatorEvent, source, target } = operation
  if (!source) {
    return undefined
  }
  const sourceId = source.id
  const sourceIndex = isSortable(source) ? source.index : -1
  if (!target || target.id === source.id || target.disabled) {
    return { sourceId, sourceIndex }
  }
  const targetIndex = isSortable(target) ? target.index : -1

  const positions = (target.data as ItemData | undefined)?.positions ?? DEFAULT_POSITIONS
  const rect = target.shape?.boundingRectangle
  let ratio: number
  if (isKeyboardDrag(activatorEvent) || !rect || rect.height <= 0) {
    // Keyboard moves step from item to item, so the direction of travel picks the side.
    ratio = targetIndex > sourceIndex ? 1 : 0
  } else {
    ratio = (point.y - rect.top) / rect.height
  }

  const position = pickPosition(ratio, positions)
  return position
    ? { sourceId, sourceIndex, targetId: target.id, targetIndex, position }
    : { sourceId, sourceIndex }
}

function sameState(prev: SortableDragState | undefined, next: SortableDragState | undefined) {
  return (
    prev?.sourceId === next?.sourceId &&
    prev?.sourceIndex === next?.sourceIndex &&
    prev?.targetId === next?.targetId &&
    prev?.targetIndex === next?.targetIndex &&
    prev?.position === next?.position
  )
}

/**
 * Creates drag and drop state for one collection over `@dnd-kit/solid`. Wrap the component that
 * renders the items in `Provider` and register each item element with `useItem`.
 *
 * Items keep their place while dragging: the target item gets `data-drop-position`, and `onDrop`
 * reports the location when the drag ends. Elements owned by Solid or a virtualizer are never
 * moved by dnd kit. Use `createListSortable` for flat lists.
 */
export function createSortable(options: SortableOptions = {}): Sortable {
  // Pointer moves report the same location many times; only changes notify items.
  const [state, setState] = createSignal<SortableDragState | undefined>(undefined, {
    equals: sameState,
  })

  const allowed = (next: SortableDragState | undefined): next is SortableDropTarget =>
    next?.targetId !== undefined &&
    next.position !== undefined &&
    (options.canDrop?.(next as SortableDropTarget) ?? true)

  const report = (next: SortableDragState | undefined): void => {
    setState(
      next && !allowed(next) ? { sourceId: next.sourceId, sourceIndex: next.sourceIndex } : next,
    )
  }

  // Current element of each registered item, for the drop animation.
  const elements = new Map<SortableId, HTMLElement>()
  const animation = options.dropAnimation === false ? undefined : (options.dropAnimation ?? {})

  /** Slides the element of `id` from `from` (viewport position) to where it has settled. */
  const animateInto = (manager: DragDropManager, id: SortableId, from: Rect): void => {
    if (!animation || prefersReducedMotion()) {
      return
    }
    void manager.renderer.rendering.then(() => {
      let frames = 0
      const run = (): void => {
        const element = elements.get(id)
        if (!element?.isConnected) {
          return
        }
        // Wait until dnd kit releases the lifted element.
        if (element.hasAttribute(DRAGGING_ATTRIBUTE)) {
          if (frames++ < MAX_SETTLE_FRAMES) {
            requestAnimationFrame(run)
          }
          return
        }
        const to = element.getBoundingClientRect()
        const dx = from.left - to.left
        const dy = from.top - to.top
        if (Math.abs(dx) + Math.abs(dy) < 1 || typeof element.animate !== 'function') {
          return
        }
        // `translate` composes with the `transform` that positions virtual rows.
        element.animate([{ translate: `${dx}px ${dy}px` }, { translate: '0 0' }], {
          duration: animation.duration ?? 200,
          easing: animation.easing ?? 'cubic-bezier(0.25, 1, 0.5, 1)',
        })
      }
      // The host has rendered the move by now; start before the next paint.
      run()
    })
  }

  const ClientProvider: FlowComponent = (props) => {
    let active = false
    const update = (manager: DragDropManager, point?: Point): void => {
      if (active) {
        report(readDragState(manager.dragOperation, point))
      }
    }

    return (
      <DragDropProvider
        sensors={options.sensors}
        plugins={(defaults) =>
          configureFeedback(
            typeof options.plugins === 'function'
              ? options.plugins(defaults)
              : (options.plugins ?? defaults),
          )
        }
        modifiers={options.modifiers}
        onDragStart={(_event, manager) => {
          active = true
          update(manager)
        }}
        onDragMove={(event, manager) => {
          // `dragmove` is dispatched before the operation applies the new position.
          const { x, y } = manager.dragOperation.position.current
          update(manager, event.to ?? { x: x + (event.by?.x ?? 0), y: y + (event.by?.y ?? 0) })
        }}
        onDragOver={(event, manager) => {
          // Stops the optimistic sorting plugin from moving item elements.
          event.preventDefault()
          update(manager)
        }}
        onDragEnd={(event, manager) => {
          active = false
          setState(undefined)
          const source = event.operation.source
          // The lifted element is still where the user released it.
          const released =
            (source ? elements.get(source.id)?.getBoundingClientRect() : undefined) ??
            event.operation.shape?.current.boundingRectangle
          const final = event.canceled ? undefined : readDragState(event.operation)
          const settledId = allowed(final)
            ? (options.onDrop?.(final) ?? final.sourceId)
            : source?.id
          if (released && settledId !== undefined) {
            animateInto(manager, settledId, released)
          }
        }}
      >
        {props.children}
      </DragDropProvider>
    )
  }

  // Handles rendered apart from their item attach by id, in either mount order.
  const handleSetters = new Map<SortableId, (element: HTMLElement) => void>()
  const pendingHandles = new Map<SortableId, HTMLElement>()
  const handleRefFor =
    (id: SortableId) =>
    (element: HTMLElement): void => {
      const setHandle = handleSetters.get(id)
      if (setHandle) {
        setHandle(element)
      } else {
        pendingHandles.set(id, element)
      }
    }

  // The server renders items without a drag manager; they become sortable after hydration.
  const Provider: FlowComponent = isServer ? (props) => <>{props.children}</> : ClientProvider

  const useItem = (input: SortableItemInput): SortableItem => {
    const dragging = (): boolean => state()?.sourceId === input.id()
    const dropPosition = (): SortableDropPosition | undefined => {
      const current = state()
      return current?.targetId === input.id() ? current.position : undefined
    }
    const attributes = itemDataAttributes({ dragging, dropPosition }) as SortableItemAttributes
    if (isServer) {
      const noop = (): void => {}
      return { ref: noop, handleRef: noop, targetRef: noop, dragging, dropPosition, attributes }
    }

    const data: ItemData = {
      get positions() {
        return input.positions?.() ?? DEFAULT_POSITIONS
      },
    }
    const sortable = useSortable<ItemData>({
      get id() {
        return input.id()
      },
      get index() {
        return input.index()
      },
      get disabled() {
        return input.disabled?.() ?? false
      },
      data,
      // Index changes come from the host's re-render after a drop, which the drop animation
      // already covers; dnd kit's own index transition would animate from the stale index.
      transition: null,
    })
    const handleRef = (element: HTMLElement): void => {
      sortable.handleRef(element)
    }
    createRenderEffect(
      on(input.id, (id) => {
        handleSetters.set(id, handleRef)
        const pending = pendingHandles.get(id)
        if (pending) {
          pendingHandles.delete(id)
          handleRef(pending)
        }
        onCleanup(() => {
          if (handleSetters.get(id) === handleRef) {
            handleSetters.delete(id)
          }
        })
      }),
    )
    let element: HTMLElement | undefined
    createRenderEffect(
      on(input.id, (id) => {
        if (element) {
          elements.set(id, element)
        }
        onCleanup(() => {
          if (elements.get(id) === element) {
            elements.delete(id)
          }
        })
      }),
    )
    return {
      ref: (next) => {
        element = next
        elements.set(untrack(input.id), next)
        sortable.ref(next)
      },
      handleRef,
      targetRef: (element) => sortable.targetRef(element),
      dragging,
      dropPosition,
      attributes,
    }
  }

  const rangeExtractor = (range: SortableVirtualRange): number[] => {
    const start = Math.max(range.startIndex - range.overscan, 0)
    const end = Math.min(range.endIndex + range.overscan, range.count - 1)
    const indexes: number[] = []
    for (let index = start; index <= end; index++) {
      indexes.push(index)
    }
    // Read untracked: virtualizers call this outside Solid, on every range change.
    const source = untrack(state)?.sourceIndex
    if (source === undefined || source < 0 || source >= range.count) {
      return indexes
    }
    if (source < start) {
      indexes.unshift(source)
    } else if (source > end) {
      indexes.push(source)
    }
    return indexes
  }

  return { Provider, useItem, handleRefFor, state, rangeExtractor }
}
