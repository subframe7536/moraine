import type { Accessor, JSX } from 'solid-js'
import { createSignal, onCleanup } from 'solid-js'

export namespace VirtualRenderT {
  /** Attributes forwarded to the final virtual row element. */
  export type RowProps<TItemElement extends HTMLElement = HTMLElement> = Omit<
    JSX.HTMLAttributes<TItemElement>,
    'ref'
  > & {
    ref?: (element: TItemElement) => void
    'data-index'?: number | string
  }

  /** Reactive context passed to a caller-provided virtual renderer. */
  export interface Context<
    TEntry,
    TScrollElement extends HTMLElement = HTMLElement,
    TItemElement extends HTMLElement = HTMLElement,
  > {
    /** Complete reactive collection, including structural entries such as group labels. */
    readonly entries: readonly TEntry[]
    /** Current scroll container, or undefined while it is not mounted. */
    readonly scrollElement: TScrollElement | undefined
    /** Renders an entry and forwards optional attributes to its final row element. */
    render: (entry: TEntry, index: number, props?: RowProps<TItemElement>) => JSX.Element
  }

  /** Configuration for creating a virtual render context. */
  export interface Options<TEntry, TItemElement extends HTMLElement = HTMLElement> {
    /** Reactive complete collection exposed through the context. */
    entries: Accessor<readonly TEntry[]>
    /** Component-owned renderer that applies row semantics and styling. */
    render: (entry: TEntry, index: number, props?: RowProps<TItemElement>) => JSX.Element
  }

  /** Stable virtual render context and scroll-element ref setter. */
  export interface Return<
    TEntry,
    TScrollElement extends HTMLElement = HTMLElement,
    TItemElement extends HTMLElement = HTMLElement,
  > {
    context: Context<TEntry, TScrollElement, TItemElement>
    setScrollElement: (element: TScrollElement | undefined) => void
  }
}

/** Creates the reactive bridge between a component-owned collection and a virtual renderer. */
export function useVirtualRender<
  TEntry,
  TScrollElement extends HTMLElement = HTMLElement,
  TItemElement extends HTMLElement = HTMLElement,
>(
  options: VirtualRenderT.Options<TEntry, TItemElement>,
): VirtualRenderT.Return<TEntry, TScrollElement, TItemElement> {
  const [scrollElement, setScrollElement] = createSignal<TScrollElement | undefined>()
  const context: VirtualRenderT.Context<TEntry, TScrollElement, TItemElement> = {
    get entries() {
      return options.entries()
    },
    get scrollElement() {
      return scrollElement()
    },
    render: (entry, index, props) => options.render(entry, index, props),
  }

  onCleanup(() => setScrollElement(undefined))

  return {
    context,
    setScrollElement: (element) => setScrollElement(() => element),
  }
}
