import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types.ts'

import type { AvatarT } from './avatar.types.ts'

export namespace AvatarGroupT {
  export interface Slot<T = unknown> {
    /** Container of grouped avatars. */
    root?: T

    /** Individual avatar wrapper used when rendering grouped avatars. */
    item?: T

    /** Count indicator shown when a group has more avatars than the visible limit. */
    count?: T

    /** Loaded avatar image rendered inside each frame. */
    image?: T

    /** Text fallback shown while an image is unavailable or failed. */
    fallback?: T

    /** Icon fallback shown when no image or text fallback is available. */
    fallbackIcon?: T

    /** Status or indicator badge anchored to an avatar frame. */
    badge?: T
  }

  export interface Variant {
    size?: 'sm' | 'md' | 'lg'
  }

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
