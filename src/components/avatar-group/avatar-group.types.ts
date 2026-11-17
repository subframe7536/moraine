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

  export type Item = Omit<AvatarT.Base, 'slotName'> & AvatarT.Variants

  /** Base props for the AvatarGroup component. */
  export interface Base {
    /**
     * Avatars to render, in order. Each entry accepts the `Avatar` props (`src`, `alt`, `text`,
     * `icon`, `badge`, `badgePosition`, `onStatusChange`) except `slotName`. An entry's `size` is
     * overridden by the group `size`. An empty array renders nothing.
     * @example
     * ```tsx
     * import { AvatarGroup } from 'moraine'
     *
     * <AvatarGroup
     *   items={[
     *     { src: '/alex.png', alt: 'Alex Rivera' },
     *     { text: 'BK', alt: 'Blake Kim', badge: 'icon-success' },
     *   ]}
     * />
     * ```
     * @default []
     */
    items?: Item[]

    /**
     * Maximum number of avatars shown. The remaining ones are replaced by a single `+N` count
     * element. Fractions are rounded down and negative values show none. All items are shown when
     * `undefined`.
     */
    max?: number
  }

  /** Props for the AvatarGroup component. */
  export type Props = BaseProps<'div', Base, Variants, Classes, Styles>
}

/** Props for the AvatarGroup component. */
export type AvatarGroupProps = AvatarGroupT.Props
