import { createDataAttributes } from '../../theme/style-contract'
import type { DataAttributeContract } from '../../theme/style-contract'

type PopperDataSlot = 'trigger' | 'content' | 'positioner'

export const popperDataAttributes = {
  trigger: createDataAttributes('closed', 'disabled', 'expanded'),
  content: createDataAttributes('closed', 'expanded'),
  positioner: createDataAttributes('positioned'),
} satisfies DataAttributeContract<PopperDataSlot>
