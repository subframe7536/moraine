import type { ComponentStyleConfig } from '../../theme/types'
import type {
  OverlayMenuStyleSlot,
  OverlayMenuStyleVariants,
} from '../shared/overlay/menu/style-types'

export type ContextMenuStyleSlot<T = unknown> = OverlayMenuStyleSlot<T>
export type ContextMenuStyleVariants = OverlayMenuStyleVariants

export type ContextMenuStyleConfig = ComponentStyleConfig<
  ContextMenuStyleSlot,
  ContextMenuStyleVariants
>
