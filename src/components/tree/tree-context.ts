import type { Component, JSX } from 'solid-js'

import { useRecipe } from '../../provider'
import { createContextProvider } from '../../shared/create-context-provider'
import type { SlotClassValue } from '../../theme/style-types'
import type { SlotOverrides } from '../../theme/use-recipe'
import type { ListT } from '../list/list.types'

import type { TreeState } from './tree-state'
import { treeRecipe } from './tree.recipe'
import type { TreeStyleSlot } from './tree.style-types'
import type { TreeT } from './tree.types'

export interface TreeContext {
  readonly state: TreeState<any>
  readonly options: TreeT.Options<any>
  readonly props: TreeT.Base<any>
  readonly variants: Pick<TreeT.Variants, 'size' | 'variant' | 'indentGuide'>
  readonly slotOverrides: SlotOverrides<keyof TreeStyleSlot>
  readonly RenderItem: Component<TreeRenderItemProps>
}

/** Props of the internal per-item renderer; `row` is set by the virtualizer. */
export interface TreeRenderItemProps {
  readonly item: TreeT.ItemInstance<unknown>
  readonly row?: ListT.RowProps
}

export const [TreeProvider, useTreeContext] =
  /* @__PURE__ */ createContextProvider<TreeContext>('Tree')

export const [TreeItemProvider, useTreeItemContext] =
  /* @__PURE__ */ createContextProvider<TreeT.ItemInstance<unknown>>('TreeItem')

/** Virtual row props for the next `TreeItem`, which consumes and clears them. */
export const [TreeRowProvider, useTreeRowContext] =
  /* @__PURE__ */ createContextProvider<ListT.RowProps | null>('TreeRow', null)

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
