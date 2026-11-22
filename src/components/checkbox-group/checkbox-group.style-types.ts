import type { ComponentSize, Orientation } from '../../theme/style-types'
import type { ComponentStyleConfig } from '../../theme/types'
export interface CheckboxGroupStyleSlot<T = unknown> {
  /** Group container that owns checkbox collection state and layout. */
  root?: T

  /** Fieldset element that groups checkbox options for accessibility. */
  fieldset?: T

  /** Legend text that labels the checkbox group. */
  legend?: T

  /** Wrapper for one checkbox option in the group. */
  item?: T

  /** Vertical alignment wrapper for an option's checkbox control. */
  container?: T

  /** Visible checkbox control for an individual option. */
  control?: T

  /** Visual checked or indeterminate state layer for an option. */
  indicator?: T

  /** Text column for an option label and description. */
  wrapper?: T

  /** Primary label text for an option. */
  label?: T

  /** Supporting description for an option. */
  description?: T
}

export interface CheckboxGroupStyleVariants {
  /** Visual layout direction.
   * @default 'vertical'
   */
  orientation?: Orientation
  /** Visual size of the component.
   * @default 'md'
   */
  size?: ComponentSize
  /**
   * Layout of the options. `list` stacks plain checkbox rows with a gap. `card` renders each
   * option as a separate bordered, padded card that toggles when clicked anywhere. `table` joins
   * the options into one bordered block with shared edges, each row toggling when clicked
   * anywhere.
   * @default 'list'
   */
  variant?: 'card' | 'table' | 'list'
  /**
   * Where each item's checkbox control sits relative to its label: `'leading'`, `'trailing'`, or
   * `'hidden'` to visually hide the control, as in selectable cards.
   * @default 'leading'
   */
  indicatorPosition?: 'leading' | 'trailing' | 'hidden'
}

export type CheckboxGroupStyleConfig = ComponentStyleConfig<
  CheckboxGroupStyleSlot,
  CheckboxGroupStyleVariants
>
