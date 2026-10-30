// `moraine/virtualizer` entry. It keeps the optional `@tanstack/virtual-core` peer out of the main entry.
export { createListVirtualizer } from './list-virtualizer'
export type {
  ListVirtualizerOptions,
  ListVirtualizerReturn,
  RowProps,
  VirtualRenderProps,
} from './list-virtualizer'
export { createTableVirtualizer } from './table-virtualizer'
export type { TableVirtualRenderProps } from './table-virtual-render'
export type { TableVirtualizerOptions, TableVirtualizerReturn } from './table-virtualizer'
