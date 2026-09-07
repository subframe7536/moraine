import type { BaseProps, SlotClassValue, SlotStyleValue } from '../../shared/types.ts'
import type { IconT } from '../icon/index.ts'

export namespace AvatarT {
  export type Status = 'idle' | 'loading' | 'loaded' | 'error'

  export interface Slot<T = unknown> {
    /** Avatar frame that controls size, shape, image, fallback, and badge placement. */
    root?: T

    /** Loaded avatar image rendered inside the frame. */
    image?: T

    /** Text fallback shown while the image is unavailable or failed. */
    fallback?: T

    /** Icon fallback shown when no image or text fallback is available. */
    fallbackIcon?: T

    /** Status or indicator badge anchored to the avatar frame. */
    badge?: T
  }

  export interface Variant {
    size?: 'sm' | 'md' | 'lg'
    badgePosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  }

  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

  export interface Item {}

  /** Base props for the Avatar component. */
  export interface Base {
    /** Source URL for the avatar image. */
    src?: string

    /** Accessible alt text for the avatar. */
    alt?: string

    /** Icon name for the badge. */
    badge?: IconT.Name

    /**
     * Position of the badge.
     * @default 'bottom-right'
     */
    badgePosition?: NonNullable<Variant['badgePosition']>

    /** Initial text to show if image fails or is missing. */
    text?: string

    /** Icon name to show as fallback. */
    fallback?: IconT.Name

    /** Callback when the loading status of the avatar changes. */
    onStatusChange?: (status: Status) => void
  }

  /** Props for the Avatar component. */
  export type Props = BaseProps<'span', Base, Variant, Classes, Styles>
}

/** Props for the Avatar component. */
export interface AvatarProps extends AvatarT.Props {}
