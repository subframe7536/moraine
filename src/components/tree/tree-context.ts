import type { Component, JSX } from 'solid-js'

import { useRecipe } from '../../provider'
import { createContextProvider } from '../../shared/create-context-provider'
import type { SlotClassValue } from '../../theme/style-types'
import type { SlotOverrides } from '../../theme/use-recipe'
import type { ListT } from '../list/list.types'

import { treeRecipe } from './tree.recipe'
import type { TreeStyleSlot } from './tree.style-types'
import type { TreeT } from './tree.types'

export interface TreeContext {
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

export function useTreeItem(): TreeT.ItemInstance<unknown> {
  const context = useTreeItemContext()
  if (!context) {
    throw new Error('useTreeItem must be used within a TreeItemProvider')
  }
  return context.item
}

export function useTreePart(
  slot: Extract<keyof TreeStyleSlot, string>,
  local: { class?: SlotClassValue; style?: JSX.CSSProperties },
) {
  const context = useTreeContext()
  return useRecipe(treeRecipe, local, {
    slot,
    contextVariants: () => context.variants,
    contextSlots: () => context.slotOverrides,
  })
}
