import type { Accessor } from 'solid-js'

import { createControllableValue } from '../../../../shared/controllable-value'

import type { OverlayMenuRadioGroupItem } from './types'

export interface MenuRadioGroupState {
  value: Accessor<string | undefined>
  select: (value: string) => void
}

export function createMenuRadioGroupState(
  group: Accessor<OverlayMenuRadioGroupItem | undefined>,
): MenuRadioGroupState {
  const [value, setValue] = createControllableValue<string | undefined>({
    value: () => group()?.value,
    defaultValue: () => group()?.defaultValue,
  })

  return {
    value,
    select: (next) => {
      setValue(next)
      group()?.onValueChange?.(next)
    },
  }
}
