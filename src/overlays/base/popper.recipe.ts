import { createDataAttributes } from '../../shared/style-contract.ts'
import type { StyleContractState } from '../../shared/style-contract.ts'

export const popperDataAttributes = {
  trigger: (state: StyleContractState) =>
    createDataAttributes({
      'data-closed': state.closed,
      'data-disabled': state.disabled,
      'data-expanded': state.expanded,
    }),
  content: (state: StyleContractState) =>
    createDataAttributes({
      'data-closed': state.closed,
      'data-expanded': state.expanded,
    }),
  positioner: (state: StyleContractState) =>
    createDataAttributes({ 'data-positioned': state.positioned }),
}
