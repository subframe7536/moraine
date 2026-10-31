import type { Accessor, JSX } from 'solid-js'
import { Show, createContext, createSignal, untrack, useContext } from 'solid-js'
import { Dynamic } from 'solid-js/web'

import { createDataAttributes } from '../theme/style-contract'

import type {
  Sortable,
  SortableDragState,
  SortableDropPosition,
  SortableDropTarget,
  SortableItemInput,
  SortableItemRefs,
} from './sortable.types'

// Imported by the main entry: it must not import `@dnd-kit/solid` or a module that does.

interface SortableContextValue {
  sortable: Sortable
  state: Accessor<SortableDragState | undefined>
}

const SortableContext = createContext<SortableContextValue>()

const NO_STATE: Accessor<SortableDragState | undefined> = () => undefined

/**
 * Mounts a host's `sortable` around its items, or renders them unchanged when there is none.
 * `children` receives the drag state so a host can keep the source rendered, for example as a
 * pinned virtual row.
 */
export function SortableRoot(props: {
  sortable: Sortable | undefined
  /** Rejects a drop location; rejected targets show no indicator and do not drop. */
  canDrop?: (target: SortableDropTarget) => boolean
  onDrop: (target: SortableDropTarget) => void
  children: (state: Accessor<SortableDragState | undefined>) => JSX.Element
}): JSX.Element {
  const allowed = (target: SortableDropTarget): boolean => props.canDrop?.(target) ?? true

  return (
    <Show keyed when={props.sortable} fallback={untrack(() => props.children(NO_STATE))}>
      {(sortable) => {
        // Pointer moves report the same location many times; only changes notify items.
        const [state, setState] = createSignal<SortableDragState | undefined>(undefined, {
          equals: (prev, next) =>
            prev?.sourceId === next?.sourceId &&
            prev?.targetId === next?.targetId &&
            prev?.position === next?.position,
        })
        return (
          <SortableContext.Provider value={{ sortable, state }}>
            <Dynamic
              component={sortable.Provider}
              onChange={(next: SortableDragState | undefined) => {
                if (next?.targetId !== undefined && next.position !== undefined) {
                  const target = { ...next } as SortableDropTarget
                  if (!allowed(target)) {
                    setState({ sourceId: next.sourceId })
                    return
                  }
                }
                setState(next)
              }}
              onDrop={(target: SortableDropTarget) => {
                if (allowed(target)) {
                  props.onDrop(target)
                }
              }}
            >
              {/* Created under `Provider` so items can read its drag manager. */}
              {untrack(() => props.children(state))}
            </Dynamic>
          </SortableContext.Provider>
        )
      }}
    </Show>
  )
}

/** Drag state attributes for a sortable item element: `data-dragging` and `data-drop-position`. */
const sortableItemDataAttributes = /* @__PURE__ */ createDataAttributes('dragging', 'drop-position')

/** One mounted sortable item inside `SortableRoot`. */
export interface SortableItemBinding extends SortableItemRefs {
  /** Whether this item is the drag source. */
  dragging: Accessor<boolean>
  /** Where the source would land on this item; undefined when it is not the target. */
  dropPosition: Accessor<SortableDropPosition | undefined>
  /**
   * `data-dragging` and `data-drop-position` getters for hosts whose item element is not a recipe
   * slot. Recipe hosts pass `dragging` and `dropPosition` to their slot `data` instead.
   */
  attributes: {
    readonly 'data-dragging': '' | undefined
    readonly 'data-drop-position': SortableDropPosition | undefined
  }
}

/**
 * Registers an item with the nearest `SortableRoot`. Returns undefined when the host has no
 * `sortable`, so hosts render their items unchanged.
 */
export function useSortableItem(input: SortableItemInput): SortableItemBinding | undefined {
  const context = useContext(SortableContext)
  if (!context) {
    return undefined
  }
  const refs = context.sortable.useItem(input)
  const dragging = (): boolean => context.state()?.sourceId === input.id()
  const dropPosition = (): SortableDropPosition | undefined => {
    const state = context.state()
    return state?.targetId === input.id() ? state.position : undefined
  }
  return {
    ...refs,
    dragging,
    dropPosition,
    // The resolver prints `true` as an empty value and passes positions through.
    attributes: sortableItemDataAttributes({
      dragging,
      dropPosition,
    }) as SortableItemBinding['attributes'],
  }
}
