import type { ComponentStyleConfig } from '../../theme/types'
import type { OverlayMenuStyleSlot, OverlayMenuStyleVariant } from '../base/menu/style-types'

export type DropdownMenuStyleSlot<T = unknown> = OverlayMenuStyleSlot<T>
export type DropdownMenuStyleVariant = OverlayMenuStyleVariant

export type DropdownMenuStyleConfig = ComponentStyleConfig<
  DropdownMenuStyleSlot,
  DropdownMenuStyleVariant
>
