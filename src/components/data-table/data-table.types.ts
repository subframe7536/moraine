import type { Row, RowData, SolidTable, TableFeatures } from '@tanstack/solid-table'
import type { Component, JSX, Ref } from 'solid-js'

import type { TableVirtualRenderProps } from '../../shared/table-virtualizer'
import type { BaseProps } from '../../shared/types'
import type { SlotClassValue, SlotStyleValue } from '../../theme/style-types'

import type { DataTableStyleSlot, DataTableStyleVariants } from './data-table.style-types'

export namespace DataTableT {
  export type Kind = 'single'
  export type Slot<T = unknown> = DataTableStyleSlot<T>
  export type Variants = DataTableStyleVariants
  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

  export interface EmptyRenderProps {
    readonly colSpan: number
  }

  export interface LoadingRenderProps {
    readonly colSpan: number
  }

  export type VirtualRenderProps<
    TData extends RowData = RowData,
    _TFeatures extends TableFeatures = TableFeatures,
  > = TableVirtualRenderProps<Row<any, TData>>

  export interface ColumnMeta {
    align?: 'left' | 'center' | 'right'
    truncated?: boolean
    class?: SlotClassValue
  }

  export interface Base<
    TData extends RowData = RowData,
    TFeatures extends TableFeatures = TableFeatures,
  > {
    /** TanStack Solid Table instance from `createTable`. When omitted, an empty table with default features is used. */
    table?: SolidTable<TFeatures, TData>
    /** Ref forwarded to the outer scroll container element. */
    containerRef?: Ref<HTMLDivElement>
    /** Custom class or class getter applied to each row (`<tr>`). */
    rowClass?: SlotClassValue | ((row: Row<TFeatures, TData>) => SlotClassValue)
    /** Whether the table is currently in a loading state. */
    loading?: boolean
    /** Custom loading state content. */
    loadingRender?: JSX.Element | Component<LoadingRenderProps>
    /** Custom empty state content rendered when there are no rows. */
    emptyRender?: JSX.Element | Component<EmptyRenderProps>
    /** Maximum height for the table scroll container (e.g. `400` or `'400px'`). */
    maxHeight?: number | string
    /** Custom content rendered inside the expanded sub-row. */
    expandedRowRender?: (row: Row<TFeatures, TData>) => JSX.Element
    /** Callback fired when a table body row is clicked. */
    onRowClick?: (row: Row<TFeatures, TData>, event: MouseEvent) => void
    /** Callback fired when a table body row is double-clicked. */
    onRowDoubleClick?: (row: Row<TFeatures, TData>, event: MouseEvent) => void
    /** Component mounted inside `tbody` to render virtualized rows. */
    virtualRender?: Component<VirtualRenderProps<TData, TFeatures>>
    /** Available page size choices in the pagination dropdown. @default [5, 10, 20, 50] */
    pageSizeOptions?: readonly number[]
    /** Whether to show the page size selection dropdown menu in the pagination toolbar. @default true */
    showPageSize?: boolean
  }

  export type Props<
    TData extends RowData = RowData,
    TFeatures extends TableFeatures = TableFeatures,
  > = BaseProps<'table', Base<TData, TFeatures>, Variants, Classes, Styles>
}

/** Props for DataTable. */
export type DataTableProps<
  TData extends RowData = RowData,
  TFeatures extends TableFeatures = TableFeatures,
> = DataTableT.Props<TData, TFeatures>
