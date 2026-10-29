import type { Component } from 'solid-js'

import { createContextProvider } from '../../shared/create-context-provider'
import type { SlotOverrides } from '../../theme/use-recipe'
import type { ListT } from '../list/list.types'

import type { TreeState } from './tree-state'
import type { TreeStyleSlot } from './tree.style-types'
import type { TreeT } from './tree.types'

export interface TreeContext {
  readonly state: TreeState<any>
  readonly options: TreeT.Options<any>
  readonly props: TreeT.Base<any>
  readonly variants: Pick<TreeT.Variants, 'size' | 'variant' | 'indentGuide'>
  readonly slotOverrides: SlotOverrides<keyof TreeStyleSlot>
  readonly RenderItem: Component<TreeItemContext>
}

export interface TreeItemContext {
  readonly item: TreeT.ItemInstance<unknown>
  readonly row?: ListT.RowProps
}

export const [TreeProvider, useTreeContext] =
  /* @__PURE__ */ createContextProvider<TreeContext>('Tree')

export const [TreeItemProvider, useTreeItemContext] =
  /* @__PURE__ */ createContextProvider<TreeItemContext | null>('TreeItem', null)
