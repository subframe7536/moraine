import type { BaseProps } from '../../shared/types'
import type { SlotClassValue, SlotStyleValue } from '../../theme/style-types'
import type { IconT } from '../icon'

import type { AvatarStyleSlot, AvatarStyleVariants } from './avatar.style-types'

export namespace AvatarT {
  export type Kind = 'single'

  export type Slot<T = unknown> = AvatarStyleSlot<T>

  export type Variants = AvatarStyleVariants

  export type Classes = Slot<SlotClassValue>
  export type Styles = Slot<SlotStyleValue>

  export type Status = 'loading' | 'loaded' | 'error'

  /** Base props for the Avatar component. */
  export interface Base {
    /**
     * URL of the avatar image. Surrounding whitespace is trimmed. When empty or missing the status is
     * `error` and the fallback is shown; changing it restarts loading.
     */
    src?: string

    /**
     * Alt text of the image and accessible name of the fallback. When `text` is not set, the fallback
     * shows up to two initials taken from the first letters of the first words of `alt`.
     */
    alt?: string

    /**
     * Name of an icon rendered in a small badge anchored to a corner of the avatar (see
     * `badgePosition`). Nothing is rendered when omitted.
     */
    badge?: IconT.Name

    /**
     * Text shown in the fallback while the image is loading, failed, or missing, typically initials.
     * It is trimmed, and when blank the initials of `alt` are used instead. Ignored when `icon` is set.
     */
    text?: string

    /** Name of an icon shown in the fallback in place of `text` or initials while the image is unavailable. */
    icon?: IconT.Name

    /**
     * Root `data-slot` attribute value, also the prefix of the child slot names (for example
     * `avatar-image`, `avatar-fallback`, `avatar-badge`). Used by composing components to rename the
     * slots.
     * @default 'avatar'
     */
    slotName?: string

    /**
     * Called whenever the image status changes, including once after mount with the initial status
     * (`loading` when `src` is set, otherwise `error`). The status is `loaded` once the image has
     * loaded and `error` when it fails or `src` is empty. It is not called on the server.
     * @example
     * ```tsx
     * import { Avatar } from 'moraine'
     *
     * <Avatar
     *   src="/alex.png"
     *   alt="Alex Rivera"
     *   onStatusChange={(status) => console.log(status)}
     * />
     * ```
     */
    onStatusChange?: (status: Status) => void
  }

  /** Props for the Avatar component. */
  export type Props = BaseProps<'span', Base, Variants, Classes, Styles>
}

/** Props for the Avatar component. */
export type AvatarProps = AvatarT.Props
