import type { JSX } from 'solid-js'

import type { IconName } from '../../elements/icon'
import type { SlotClasses, SlotStyles } from '../../shared/slot'

import type { OverlayMenuItems } from './utils'

export type OverlayMenuItemType = 'item' | 'label' | 'separator' | 'checkbox'

export interface OverlayMenuSharedItem<TColor extends string, TItem> {
  type?: OverlayMenuItemType
  label?: JSX.Element
  description?: JSX.Element
  icon?: IconName | JSX.Element
  kbds?: string[]
  color?: TColor
  disabled?: boolean
  checked?: boolean
  defaultChecked?: boolean
  open?: boolean
  defaultOpen?: boolean
  children?: OverlayMenuItems<TItem>
  onSelect?: () => void
  onCheckedChange?: (checked: boolean) => void
}

type OverlayMenuSharedSlots =
  | 'trigger'
  | 'content'
  | 'group'
  | 'label'
  | 'separator'
  | 'item'
  | 'itemLeading'
  | 'itemWrapper'
  | 'itemLabel'
  | 'itemDescription'
  | 'itemTrailing'
  | 'itemKbds'
  | 'itemIndicator'
  | 'itemSub'

export type OverlayMenuSharedClasses = SlotClasses<OverlayMenuSharedSlots>

export type OverlayMenuSharedStyles = SlotStyles<OverlayMenuSharedSlots>

export interface OverlayMenuSharedItemRenderContext<TItem> {
  item: TItem
  depth: number
  isCheckbox: boolean
  hasChildren: boolean
}
