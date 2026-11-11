import type { Accessor } from 'solid-js'

import { createContextProvider } from '../../shared/create-context-provider'

import type { ResizableOrientation } from './hook'
import type { ResizableT } from './resizable.types'

/**
 * Registered panel. All accessors are read reactively by the root so prop
 * changes flow into layout resolution.
 */
export interface ResizablePanelRegistration {
  /** Panel id — layout record key and DOM id. */
  id: Accessor<string>
  element: Accessor<HTMLElement | undefined>
  /** Bounds as percentages (0-100). */
  min: Accessor<number>
  max: Accessor<number>
  resizable: Accessor<boolean>
  collapsible: Accessor<boolean>
  /** Collapsed size as a percentage (0-100). */
  collapsedSize: Accessor<number>
  onCollapse: () => void
  onExpand: () => void
}

export interface ResizableHandleRegistration {
  element: Accessor<HTMLElement | undefined>
}

export type ResizableItem =
  | { kind: 'panel'; seq: number; panel: ResizablePanelRegistration }
  | { kind: 'handle'; seq: number; handle: ResizableHandleRegistration }

export interface ResizableContext {
  orientation: Accessor<ResizableOrientation>
  disabled: Accessor<boolean>
  /** True after mount, once every initially rendered child has registered. */
  settled: Accessor<boolean>
  /** True while an interaction is actively changing panel sizes. */
  resizing: Accessor<boolean>
  slotOverrides: { classes?: ResizableT.Classes; styles?: ResizableT.Styles }
  /**
   * Registers a panel or handle with this root. Call during setup (registration
   * order is render order) and pass the returned cleanup to `onCleanup`.
   * The item's `seq` is overwritten by the root; keep the same object to look
   * up the item in `orderedItems()`.
   */
  registerItem: (item: ResizableItem) => () => void
  /** Panels and handles in DOM order. */
  orderedItems: () => ResizableItem[]
  /** Panels only, in DOM order. */
  orderedPanels: () => ResizablePanelRegistration[]
  /** Index of the panel in `orderedPanels()`, or -1. */
  panelIndex: (panel: ResizablePanelRegistration) => number
  /** Resolved size of the panel in percent (0-100). */
  panelSize: (panel: ResizablePanelRegistration) => number | undefined
  /**
   * Pre-settle flex-basis in percent: the layout-record entry clamped to
   * min/max, or `undefined` when the record has no entry for the panel.
   */
  panelPreSettleBasis: (panel: ResizablePanelRegistration) => number | undefined
  panelCollapsed: (panel: ResizablePanelRegistration) => boolean
  panelTransitioning: (panel: ResizablePanelRegistration) => boolean
  clearPanelTransition: (id: string) => void
  /** Drag a handle by a pixel delta; `precedingIndex` is the index of the panel before the handle. */
  dragHandle: (precedingIndex: number, deltaPx: number, altKey: boolean) => void
  endHandleDrag: () => void
  handleKeyDown: (precedingIndex: number, event: KeyboardEvent) => void
  collapsePanel: (id: string) => void
  expandPanel: (id: string) => void
  resizePanel: (id: string, size: number) => void
}

export const [ResizableProvider, useResizableContext] =
  createContextProvider<ResizableContext>('Resizable')

export const [ResizablePanelProvider, useResizablePanelContext] =
  createContextProvider<ResizableT.PanelContext>('ResizablePanel')
