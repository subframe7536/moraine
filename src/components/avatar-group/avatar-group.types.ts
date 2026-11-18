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

  /** One avatar entry: the `Avatar` props except `size`, which the group sets. */
  export type Item = AvatarT.Base & Omit<AvatarT.Variants, 'size'>

  /** Base props for the AvatarGroup component. */
  export interface Base {
    /**
     * Avatars to render, in order. Each entry accepts the `Avatar` props (`src`, `alt`, `text`,
     * `icon`, `badge`, `badgePosition`, `onStatusChange`) except `size`; every avatar uses the
     * group `size`. An empty array renders nothing.
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
    maxVisible?: number
  }

  /** Props for the AvatarGroup component. */
  export type Props = BaseProps<'div', Base, Variants, Classes, Styles>
}

/** Props for the AvatarGroup component. */
export type AvatarGroupProps = AvatarGroupT.Props
