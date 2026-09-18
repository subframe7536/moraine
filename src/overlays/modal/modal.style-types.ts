export interface ModalStyleSlot<T = unknown> {
  /** Fixed backdrop that contains the modal shell. */
  overlay?: T

  /** Modal panel that contains the dialog content. */
  content?: T
}

export type ModalStyleVariant = never
