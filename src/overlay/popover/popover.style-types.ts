export interface PopoverStyleSlot<T = unknown> {
  /** Element that opens the popover. */
  trigger?: T

  /** Positioned popover panel anchored to the trigger. */
  content?: T

  /** Content body rendered inside the popover panel. */
  body?: T
}

export type PopoverStyleVariant = never
