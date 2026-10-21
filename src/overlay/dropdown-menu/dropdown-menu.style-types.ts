import type { ComponentStyleConfig } from '../../theme/types'
import type { OverlayMenuStyleSlot, OverlayMenuStyleVariants } from '../base/menu/style-types'

export type DropdownMenuStyleSlot<T = unknown> = OverlayMenuStyleSlot<T>
export type DropdownMenuStyleVariants = OverlayMenuStyleVariants

export type DropdownMenuStyleConfig = ComponentStyleConfig<
  DropdownMenuStyleSlot,
  DropdownMenuStyleVariants
>
