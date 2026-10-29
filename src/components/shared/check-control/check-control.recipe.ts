import { createDataAttributes } from '../../../theme/style-contract'
import { CHECKBOX_CONTROL_CLASS, CHECKBOX_ICON_CLASS } from '../../checkbox/checkbox.recipe'

/** Check-state attributes on a `CheckControl` host. */
export const checkControlDataAttributes = /* @__PURE__ */ createDataAttributes(
  'checked',
  'disabled',
  'indeterminate',
  'unchecked',
)

/** Checkbox surface; the indeterminate state fills like the checked state. */
export const CHECK_CONTROL_CLASS = `${CHECKBOX_CONTROL_CLASS} data-indeterminate:(border-primary bg-primary)`

/** Check or indeterminate icon inside the control. */
export const CHECK_CONTROL_ICON_CLASS = `${CHECKBOX_ICON_CLASS} text-primary-foreground`

/** Control sizes matching `Checkbox`, for host recipes with a `size` variant. */
export const CHECK_CONTROL_SIZE_CLASS = {
  sm: 'size-3.5',
  md: 'size-4',
  lg: 'size-4.5',
} as const
