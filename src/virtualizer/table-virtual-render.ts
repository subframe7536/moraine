import type { ListT } from '../components/list/list.types'

// Kept apart from `table-virtualizer.tsx` so that `moraine/data-table` declarations can name the
// render props without importing the optional `@tanstack/virtual-core` peer.

/** Props passed to a table `virtualRender` component, such as `createTableVirtualizer().virtualRender`. */
export type TableVirtualRenderProps<TItem> = Omit<
  ListT.VirtualRenderProps<TItem, HTMLElement, HTMLTableRowElement>,
  'scrollElement'
> & {
  /**
   * Scroll container for the rows; defaults to the adapter's host `tbody`. Pass an ancestor
   * element only when scrolling happens outside the table body. The adapter then measures the
   * body offset inside it (`scrollMargin`) and the height of a sticky header or footer
   * (`scrollPaddingStart` / `scrollPaddingEnd`), unless those options are set explicitly.
   */
  readonly scrollElement?: HTMLElement
}
