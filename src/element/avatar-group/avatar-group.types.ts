import type { BaseProps } from '../../shared/types'
import type { SlotClassValue, SlotStyleValue } from '../../theme/style-types'
import type { AvatarT } from '../avatar/avatar.types'

import type { AvatarGroupStyleSlot, AvatarGroupStyleVariants } from './avatar-group.style-types'

export namespace AvatarGroupT {
  export type Kind = 'single'

  export type Slot<T = unknown> = AvatarGroupStyleSlot<T>

  export type Variants = AvatarGroupStyleVariants

  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

  export type Item = AvatarT.Base & AvatarT.Variants

  /** Base props for the AvatarGroup component. */
  export interface Base {
    /**
     * Array of avatars to render in the group.
     * @default []
     */
    items?: Item[]

    /** Maximum number of avatars to show. */
    max?: number
  }

  /** Props for the AvatarGroup component. */
  export type Props = BaseProps<'div', Base, Variants, Classes, Styles>
}

/** Props for the AvatarGroup component. */
export type AvatarGroupProps = AvatarGroupT.Props
