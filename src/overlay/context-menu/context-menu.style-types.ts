import type { ComponentStyleConfig } from '../../theme/types'
import type { OverlayMenuStyleSlot, OverlayMenuStyleVariants } from '../base/menu/style-types'

export type ContextMenuStyleSlot<T = unknown> = OverlayMenuStyleSlot<T>
export type ContextMenuStyleVariants = OverlayMenuStyleVariants

export type ContextMenuStyleConfig = ComponentStyleConfig<
  ContextMenuStyleSlot,
  ContextMenuStyleVariants
>
