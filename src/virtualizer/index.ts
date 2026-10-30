// `moraine/virtualizer` entry. It keeps the optional `@tanstack/virtual-core` peer out of the main entry.
export { createListVirtualizer } from './list-virtualizer'
export type { ListVirtualizerOptions, ListVirtualizerReturn } from './list-virtualizer'
export { createTableVirtualizer } from './table-virtualizer'
export type {
  TableVirtualizerColumnOptions,
  TableVirtualizerOptions,
  TableVirtualizerReturn,
} from './table-virtualizer'
export type {
  ListVirtualizer,
  TableVirtualColumn,
  TableVirtualColumnLayout,
  TableVirtualColumnWindow,
  TableVirtualRenderProps,
  TableVirtualRowProps,
  TableVirtualizer,
  VirtualRenderProps,
  VirtualRowProps,
  VirtualScrollToOptions,
} from '../shared/virtual'
