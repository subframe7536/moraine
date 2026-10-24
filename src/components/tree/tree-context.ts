import type { Component } from 'solid-js'

import { createContextProvider } from '../../shared/create-context-provider'
import type { ListT } from '../list/list.types'

import type { TreeT } from './tree.types'

export interface TreeContext {
  readonly variants: TreeT.Variants
  readonly slotOverrides: {
    readonly classes?: TreeT.Classes
    readonly styles?: TreeT.Styles
  }
  /** Whether items render flat inside a virtualizer instead of nested. */
  readonly isVirtual: boolean
  readonly checkable: boolean
  readonly animate: boolean
  readonly unmountOnHide: boolean
  readonly icons: Required<TreeT.Icons>
  /** Renders one item through the caller's `itemRender` or the default item. */
  readonly RenderItem: Component<TreeT.ItemRenderProps<unknown>>
}

interface TreeItemContext {
  readonly item: TreeT.ItemInstance<unknown>
}

export const [TreeProvider, useTreeContext] =
  /* @__PURE__ */ createContextProvider<TreeContext>('Tree')

export const [TreeItemProvider, useTreeItemContext] =
  /* @__PURE__ */ createContextProvider<TreeItemContext>('TreeItem')

/** Row attributes supplied by the virtualizer for the item currently rendered. */
export const [TreeRowProvider, useTreeRowContext] =
  /* @__PURE__ */ createContextProvider<ListT.RowProps | null>('TreeRow', null)
