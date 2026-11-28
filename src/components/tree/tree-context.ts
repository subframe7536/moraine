import type { Component } from 'solid-js'

import { createContextProvider } from '../../shared/create-context-provider'
import type { SlotOverrides } from '../../theme/use-recipe'
import type { ListT } from '../list/list.types'

import type { TreeState } from './tree-state'
import type { TreeStyleSlot } from './tree.style-types'
import type { TreeT } from './tree.types'
export interface TreeContext {
  readonly state: TreeState<unknown>
  readonly options: TreeT.Options<unknown>
  readonly props: TreeT.Base
  readonly variants: Pick<TreeT.Variants, 'size' | 'variant' | 'indentGuide' | 'transition'>
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

export function requireTreeItemContext(): TreeItemContext {
  const context = useTreeItemContext()
  if (!context) {
    throw new Error('TreeItem sub-components must be used within a TreeItem')
  }
  return context
}
