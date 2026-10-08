import { createDataAttributes } from '../../theme/style-contract'
import type { DataAttributeContract } from '../../theme/style-contract'

type PopperDataSlot = 'trigger' | 'content' | 'positioner'

export const popperDataAttributes = {
  trigger: /* @__PURE__ */ createDataAttributes('closed', 'disabled', 'expanded'),
  content: /* @__PURE__ */ createDataAttributes('closed', 'expanded'),
  positioner: /* @__PURE__ */ createDataAttributes('positioned'),
} satisfies DataAttributeContract<PopperDataSlot>
