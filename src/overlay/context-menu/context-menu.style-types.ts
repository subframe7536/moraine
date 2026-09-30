import type { ComponentStyleConfig } from '../../theme/types'
import type { OverlayMenuStyleSlot, OverlayMenuStyleVariant } from '../base/menu/style-types'

export type ContextMenuStyleSlot<T = unknown> = OverlayMenuStyleSlot<T>
export type ContextMenuStyleVariant = OverlayMenuStyleVariant

export type ContextMenuStyleConfig = ComponentStyleConfig<
  ContextMenuStyleSlot,
  ContextMenuStyleVariant
>
