import { createDataAttributes } from '../../../theme/style-contract'

/** Keeps an overlay trigger visibly pressed while its overlay is open. */
export const OVERLAY_TRIGGER_CLASS = 'aria-expanded:bg-muted'

export const overlayTriggerDataAttributes = /* @__PURE__ */ createDataAttributes(
  'closed',
  'disabled',
  'expanded',
)
