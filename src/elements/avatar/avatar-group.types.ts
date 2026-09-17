import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types'

import type { AvatarGroupStyleSlot, AvatarGroupStyleVariant } from './avatar-group.style-types'
import type { AvatarT } from './avatar.types'

export namespace AvatarGroupT {
  export type Kind = 'single'

  export type Slot<T = unknown> = AvatarGroupStyleSlot<T>

  export type Variant = AvatarGroupStyleVariant

  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

  export type Item = AvatarT.Base

  /** Base props for the AvatarGroup component. */
  export interface Base {
    /**
     * Array of avatars to render in the group.
     * @default []
     */
    items?: Item[]

    /** Maximum number of avatars to show. */
    max?: number | string
  }

  /** Props for the AvatarGroup component. */
  export type Props = BaseProps<'div', Base, Variant, Classes, Styles>
}

/** Props for the AvatarGroup component. */
export interface AvatarGroupProps extends AvatarGroupT.Props {}
